const mongoose = require('mongoose');
const Solution = require('../models/Solution');
const githubService = require('../services/githubService');
const { getLanguageDetails, sanitizeProblemFolderName } = require('../utils/languageMap');
const { generateReadme } = require('../utils/readmeGenerator');
const { calculateStreaks } = require('../utils/streakCalculator');

/**
 * Check if a solution file already exists in the selected GitHub repository
 */
async function checkDuplicateSolution(req, res, next) {
  try {
    const { problemNumber, problemTitle, difficulty, language, repository, branch } = req.body;

    const targetRepo = repository || req.user.selectedRepository;
    const targetBranch = branch || req.user.selectedBranch || 'main';

    if (!targetRepo) {
      return res.status(400).json({
        success: false,
        message: 'No repository specified or configured.'
      });
    }

    const [owner, repo] = targetRepo.split('/');
    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository format (expected owner/repo).'
      });
    }

    const diffFolder = difficulty || 'Easy';
    const folderName = sanitizeProblemFolderName(problemNumber, problemTitle);
    const langDetails = getLanguageDetails(language);
    const filePath = `${diffFolder}/${folderName}/solution${langDetails.ext}`;

    const token = req.user.githubAccessToken;
    const check = await githubService.checkFileExists(token, owner, repo, filePath, targetBranch);

    res.json({
      success: true,
      exists: check.exists,
      sha: check.sha,
      path: filePath,
      htmlUrl: check.htmlUrl
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload an accepted LeetCode solution to user's GitHub repository and record in database.
 * Strictly linked to authenticated user.
 */
async function uploadSolution(req, res, next) {
  try {
    const {
      problemNumber,
      problemTitle,
      difficulty,
      language,
      code,
      approach,
      timeComplexity,
      spaceComplexity,
      repository,
      branch,
      overwrite
    } = req.body;

    if (!problemNumber || !problemTitle || !language || !code) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: problemNumber, problemTitle, language, and code are mandatory.'
      });
    }

    const targetRepo = repository || req.user.selectedRepository;
    const targetBranch = branch || req.user.selectedBranch || 'main';

    if (!targetRepo) {
      return res.status(400).json({
        success: false,
        message: 'GitHub repository not selected. Please configure your repository in the extension popup.'
      });
    }

    const [owner, repo] = targetRepo.split('/');
    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid repository format. Please use "owner/repository".'
      });
    }

    // 1. Structure paths
    const diffFolder = difficulty || 'Easy';
    const folderName = sanitizeProblemFolderName(problemNumber, problemTitle);
    const langDetails = getLanguageDetails(language);

    const codeFilePath = `${diffFolder}/${folderName}/solution${langDetails.ext}`;
    const readmeFilePath = `${diffFolder}/${folderName}/README.md`;

    // 2. Generate README content
    const readmeContent = generateReadme({
      problemNumber,
      problemTitle,
      difficulty: diffFolder,
      language,
      approach,
      timeComplexity,
      spaceComplexity,
      code
    });

    const isUpdate = Boolean(overwrite);
    const commitMessage = `${isUpdate ? 'Update' : 'Add'} LeetCode #${problemNumber} ${problemTitle} solution`;

    // 3. Commit files to GitHub using authenticated user's token
    const filesToCommit = [
      { path: codeFilePath, content: code },
      { path: readmeFilePath, content: readmeContent }
    ];

    const token = req.user.githubAccessToken;
    const commitResult = await githubService.commitSolutionFiles(
      token,
      targetRepo,
      targetBranch,
      filesToCommit,
      commitMessage
    );

    // 4. Save solution record in MongoDB strictly tied to req.user._id
    const currentUserId = req.user._id || req.user.id;
    let savedSolution = null;

    if (mongoose.connection.readyState === 1) {
      try {
        savedSolution = await Solution.create({
          userId: currentUserId,
          problemNumber: Number(problemNumber),
          problemTitle,
          slug: problemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          difficulty: diffFolder,
          language: langDetails.name,
          code,
          githubPath: codeFilePath,
          githubCommitSha: commitResult.commitSha,
          githubCommitUrl: commitResult.commitUrl,
          timeComplexity: timeComplexity || 'O(n)',
          spaceComplexity: spaceComplexity || 'O(1)',
          submittedAt: new Date()
        });
      } catch (dbErr) {
        console.warn('[Solution Controller] DB insert fallback:', dbErr.message);
      }
    }

    if (!savedSolution) {
      savedSolution = {
        userId: currentUserId,
        problemNumber,
        problemTitle,
        difficulty: diffFolder,
        language: langDetails.name,
        githubPath: codeFilePath,
        githubCommitUrl: commitResult.commitUrl
      };
    }

    res.json({
      success: true,
      message: `Solution uploaded to ${targetRepo} successfully!`,
      commitMessage,
      commitUrl: commitResult.commitUrl,
      fileUrl: commitResult.htmlUrl,
      githubPath: codeFilePath,
      solution: savedSolution
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get list of saved solutions strictly for authenticated user (isolated)
 */
async function getSolutions(req, res, next) {
  try {
    const { difficulty, search, limit = 50, page = 1 } = req.query;
    const userId = req.user._id || req.user.id;

    // Strict multi-user filter: never trust query param userId
    const query = { userId };
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (search) {
      query.problemTitle = { $regex: search, $options: 'i' };
    }

    let solutions = [];
    let total = 0;

    if (mongoose.connection.readyState === 1) {
      try {
        total = await Solution.countDocuments(query);
        solutions = await Solution.find(query)
          .sort({ submittedAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit));
      } catch (dbErr) {
        console.warn('[Solutions] DB query fallback:', dbErr.message);
      }
    }

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      solutions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get aggregated statistics strictly for authenticated user (isolated)
 */
async function getSolutionStats(req, res, next) {
  try {
    const userId = req.user._id || req.user.id;

    let solutions = [];
    if (mongoose.connection.readyState === 1) {
      try {
        solutions = await Solution.find({ userId }).select('difficulty submittedAt createdAt');
      } catch (dbErr) {
        console.warn('[Stats] DB query fallback:', dbErr.message);
      }
    }

    const total = solutions.length;
    const easy = solutions.filter((s) => s.difficulty === 'Easy').length;
    const medium = solutions.filter((s) => s.difficulty === 'Medium').length;
    const hard = solutions.filter((s) => s.difficulty === 'Hard').length;

    const dates = solutions.map((s) => s.submittedAt || s.createdAt);
    const streakInfo = calculateStreaks(dates);

    res.json({
      success: true,
      total,
      easy,
      medium,
      hard,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      thisWeek: streakInfo.thisWeek
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single solution details strictly for authenticated user (isolated)
 */
async function getSolutionById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    let solution = null;
    if (mongoose.connection.readyState === 1) {
      solution = await Solution.findOne({ _id: id, userId });
    }

    if (!solution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found.'
      });
    }

    res.json({
      success: true,
      solution
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkDuplicateSolution,
  uploadSolution,
  getSolutions,
  getSolutionStats,
  getSolutionById
};
