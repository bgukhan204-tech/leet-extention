const mongoose = require('mongoose');
const githubService = require('../services/githubService');
const User = require('../models/User');

/**
 * Get profile of connected GitHub user (safe projection)
 */
async function getGithubUser(req, res, next) {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user._id ? user._id.toString() : user.id,
        githubId: user.githubId,
        username: user.githubUsername,
        githubUsername: user.githubUsername,
        name: user.name || '',
        avatarUrl: user.avatarUrl || '',
        selectedRepository: user.selectedRepository || '',
        selectedBranch: user.selectedBranch || 'main',
        autoSave: user.autoSave !== false
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get list of accessible GitHub repositories for the authenticated user
 */
async function getRepositories(req, res, next) {
  try {
    const token = req.user.githubAccessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'GitHub account is not connected. Please reconnect your account.'
      });
    }

    const repositories = await githubService.getUserRepositories(token);

    res.json({
      success: true,
      count: repositories.length,
      repositories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validate that a repository exists and authenticated user has write permissions
 */
async function validateRepository(req, res, next) {
  try {
    const { repository, branch } = req.body;
    if (!repository) {
      return res.status(400).json({
        success: false,
        message: 'Repository parameter is required (format: owner/repository).'
      });
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository format. Please use "username/repository-name".'
      });
    }

    const token = req.user.githubAccessToken;
    const validation = await githubService.validateRepository(token, owner, repo);

    res.json({
      success: true,
      message: 'Repository validated successfully.',
      repository: validation.fullName,
      branch: branch || validation.defaultBranch,
      htmlUrl: validation.htmlUrl,
      hasWriteAccess: validation.hasWritePermission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Repository validation failed.'
    });
  }
}

/**
 * Save user's selected repository and branch after write permission validation
 */
async function setRepository(req, res, next) {
  try {
    const { repository, branch } = req.body;
    if (!repository) {
      return res.status(400).json({
        success: false,
        message: 'Repository name is required.'
      });
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository format. Please use "username/repository-name".'
      });
    }

    const token = req.user.githubAccessToken;

    // 1. Verify that user has write access to the repository before saving
    let validation;
    try {
      validation = await githubService.validateRepository(token, owner, repo);
    } catch (valErr) {
      return res.status(400).json({
        success: false,
        message: valErr.message || "This repository cannot be used because you don't have write access."
      });
    }

    const targetBranch = branch || validation.defaultBranch || 'main';

    // 2. Persist in database for the authenticated user (if DB connection is active)
    if (req.user._id && mongoose.connection.readyState === 1) {
      try {
        await User.findByIdAndUpdate(req.user._id, {
          selectedRepository: repository,
          selectedBranch: targetBranch
        });
      } catch (dbErr) {
        console.warn('[GitHub Controller] User repository DB update error:', dbErr.message);
      }
    }

    req.user.selectedRepository = repository;
    req.user.selectedBranch = targetBranch;

    res.json({
      success: true,
      message: 'Repository preferences updated successfully.',
      selectedRepository: repository,
      selectedBranch: targetBranch
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGithubUser,
  getRepositories,
  validateRepository,
  setRepository
};
