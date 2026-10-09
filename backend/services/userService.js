const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory fallback user store (survives when DB is disconnected, cold starting, or local)
const inMemoryUsers = new Map();

/**
 * Upsert and persist user in MongoDB and in-memory cache
 */
async function upsertUser(userData) {
  const githubIdStr = String(userData.githubId);
  let user = null;

  if (mongoose.connection.readyState === 1) {
    try {
      const updateData = {
        githubId: githubIdStr,
        githubUsername: userData.githubUsername,
        name: userData.name || userData.githubUsername,
        email: userData.email || '',
        avatarUrl: userData.avatarUrl || '',
        githubAccessToken: userData.githubAccessToken
      };

      // Only overwrite preferences if explicitly provided in payload
      if (userData.selectedRepository !== undefined) {
        updateData.selectedRepository = userData.selectedRepository;
      }
      if (userData.selectedBranch !== undefined) {
        updateData.selectedBranch = userData.selectedBranch;
      }
      if (userData.autoSave !== undefined) {
        updateData.autoSave = userData.autoSave;
      }

      user = await User.findOneAndUpdate(
        { githubId: githubIdStr },
        { $set: updateData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (dbErr) {
      console.warn('[User Service] MongoDB upsert fallback:', dbErr.message);
    }
  }

  if (!user) {
    // Check if user already exists in memory to retain existing preferences
    const existing = inMemoryUsers.get(githubIdStr);
    user = {
      _id: existing?._id || githubIdStr,
      id: existing?.id || githubIdStr,
      githubId: githubIdStr,
      githubUsername: userData.githubUsername,
      name: userData.name || userData.githubUsername,
      email: userData.email || '',
      avatarUrl: userData.avatarUrl || '',
      githubAccessToken: userData.githubAccessToken,
      selectedRepository: userData.selectedRepository !== undefined ? userData.selectedRepository : (existing?.selectedRepository || ''),
      selectedBranch: userData.selectedBranch !== undefined ? userData.selectedBranch : (existing?.selectedBranch || 'main'),
      autoSave: userData.autoSave !== undefined ? userData.autoSave : (existing?.autoSave !== false)
    };
  }

  // Always index in inMemoryUsers map across all possible lookups
  const idKey = user._id ? String(user._id) : githubIdStr;
  inMemoryUsers.set(idKey, user);
  inMemoryUsers.set(githubIdStr, user);
  if (user.githubUsername) {
    inMemoryUsers.set(user.githubUsername.toLowerCase(), user);
  }

  return user;
}

/**
 * Find user by ObjectId, githubId, or username across MongoDB, in-memory cache, and test locals
 */
async function findUser(identifier, username, appLocals) {
  let user = null;
  const idStr = identifier ? String(identifier) : '';
  const usernameStr = username ? String(username).toLowerCase() : '';

  // 1. Try MongoDB lookup if connection is active
  if (mongoose.connection.readyState === 1) {
    try {
      if (idStr && mongoose.Types.ObjectId.isValid(idStr)) {
        user = await User.findById(idStr);
      }
      if (!user && idStr) {
        user = await User.findOne({ githubId: idStr });
      }
      if (!user && username) {
        user = await User.findOne({ githubUsername: username });
      }
    } catch (dbErr) {
      console.warn('[User Service] MongoDB lookup error:', dbErr.message);
    }
  }

  // 2. Try In-Memory Cache if not found in MongoDB
  if (!user) {
    if (idStr && inMemoryUsers.has(idStr)) {
      user = inMemoryUsers.get(idStr);
    } else if (usernameStr && inMemoryUsers.has(usernameStr)) {
      user = inMemoryUsers.get(usernameStr);
    }
  }

  // 3. Try app.locals.mockUsers (for unit tests)
  if (!user && appLocals && appLocals.mockUsers) {
    if (idStr && appLocals.mockUsers[idStr]) {
      user = appLocals.mockUsers[idStr];
    } else if (username && appLocals.mockUsers[username]) {
      user = appLocals.mockUsers[username];
    }
  }

  return user;
}

/**
 * Update repository preferences for user
 */
async function updateRepository(userId, repository, branch) {
  const idStr = String(userId);

  if (mongoose.connection.readyState === 1) {
    try {
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        await User.findByIdAndUpdate(idStr, {
          selectedRepository: repository,
          selectedBranch: branch || 'main'
        });
      } else {
        await User.findOneAndUpdate(
          { githubId: idStr },
          {
            selectedRepository: repository,
            selectedBranch: branch || 'main'
          }
        );
      }
    } catch (dbErr) {
      console.warn('[User Service] MongoDB repository update error:', dbErr.message);
    }
  }

  // Update in memory cache
  const cached = inMemoryUsers.get(idStr);
  if (cached) {
    cached.selectedRepository = repository;
    cached.selectedBranch = branch || 'main';
  }
}

module.exports = {
  upsertUser,
  findUser,
  updateRepository,
  inMemoryUsers
};
