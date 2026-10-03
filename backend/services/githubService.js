const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';

/**
 * Helper to build standard GitHub API headers
 */
function getHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'LeetCode2Git-Extension-MultiUser'
  };
}

/**
 * Fetch authenticated GitHub user details
 */
async function getUserProfile(token) {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/user`, {
      headers: getHeaders(token)
    });
    return response.data;
  } catch (error) {
    handleGithubError(error, 'Failed to fetch GitHub user profile');
  }
}

/**
 * Fetch accessible repositories for user (both personal and collaborator repos with write access)
 */
async function getUserRepositories(token) {
  try {
    const response = await axios.get(
      `${GITHUB_API_URL}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator`,
      { headers: getHeaders(token) }
    );
    
    return response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner?.login || '',
      private: repo.private,
      defaultBranch: repo.default_branch || 'main',
      htmlUrl: repo.html_url,
      description: repo.description || '',
      hasWriteAccess: Boolean(repo.permissions?.push || repo.permissions?.admin),
      permissions: repo.permissions
    }));
  } catch (error) {
    handleGithubError(error, 'Failed to fetch GitHub repositories');
  }
}

/**
 * Validate repository exists and user has write permissions
 */
async function validateRepository(token, owner, repo) {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
      headers: getHeaders(token)
    });

    const repoData = response.data;
    const hasWritePermission = Boolean(repoData.permissions?.push || repoData.permissions?.admin);

    if (!hasWritePermission) {
      throw new Error("This repository cannot be used because you don't have write access.");
    }

    return {
      isValid: true,
      defaultBranch: repoData.default_branch || 'main',
      fullName: repoData.full_name,
      htmlUrl: repoData.html_url,
      hasWritePermission: true
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found or is not accessible.`);
    }
    if (error.message && error.message.includes("don't have write access")) {
      throw error;
    }
    handleGithubError(error, 'Failed to validate repository');
  }
}

/**
 * Check if a file already exists in repository at given path
 */
async function checkFileExists(token, owner, repo, filePath, branch = 'main') {
  try {
    const response = await axios.get(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers: getHeaders(token) }
    );
    return {
      exists: true,
      sha: response.data.sha,
      htmlUrl: response.data.html_url,
      path: response.data.path
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { exists: false, sha: null };
    }
    handleGithubError(error, `Failed to check file existence at ${filePath}`);
  }
}

/**
 * Create or update a single file in GitHub repository
 */
async function createOrUpdateFile(token, owner, repo, filePath, content, message, branch = 'main', existingSha = null) {
  try {
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');
    const body = {
      message,
      content: base64Content,
      branch
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    const response = await axios.put(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}`,
      body,
      { headers: getHeaders(token) }
    );

    return response.data;
  } catch (error) {
    handleGithubError(error, `Failed to upload file to GitHub: ${filePath}`);
  }
}

/**
 * Commit both solution code and README.md for a LeetCode problem
 */
async function commitSolutionFiles(token, repoFullName, branch, files, commitMessage) {
  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid repository format. Expected "owner/repo".');
  }

  const results = [];

  for (const file of files) {
    // Check if file already exists to obtain SHA for updates
    const check = await checkFileExists(token, owner, repo, file.path, branch);
    const sha = file.sha || check.sha;

    const res = await createOrUpdateFile(
      token,
      owner,
      repo,
      file.path,
      file.content,
      commitMessage,
      branch,
      sha
    );
    results.push(res);
  }

  const primaryCommit = results[0]?.commit || {};
  const htmlUrl = results[0]?.content?.html_url || `https://github.com/${owner}/${repo}`;
  const commitUrl = primaryCommit?.html_url || `https://github.com/${owner}/${repo}/commits/${branch}`;

  return {
    commitSha: primaryCommit.sha || '',
    commitUrl,
    htmlUrl,
    results
  };
}

/**
 * Centralized error handler for GitHub API calls
 */
function handleGithubError(error, defaultMessage) {
  if (error.response) {
    const status = error.response.status;
    const ghMessage = error.response.data?.message || error.message;

    if (status === 401) {
      throw new Error('Your GitHub authorization has expired. Please reconnect your account.');
    } else if (status === 403) {
      throw new Error(`GitHub API rate limit exceeded or access forbidden: ${ghMessage}`);
    } else if (status === 404) {
      throw new Error(`GitHub resource not found: ${ghMessage}`);
    } else if (status === 409) {
      throw new Error('Conflict: The file has been modified concurrently on GitHub.');
    }

    throw new Error(`${defaultMessage}: ${ghMessage}`);
  }

  throw new Error(`${defaultMessage}: ${error.message}`);
}

module.exports = {
  getUserProfile,
  getUserRepositories,
  validateRepository,
  checkFileExists,
  createOrUpdateFile,
  commitSolutionFiles
};
