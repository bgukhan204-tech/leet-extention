/**
 * Map LeetCode language names to standard file extensions and markdown tags
 */

const LANGUAGE_EXTENSIONS = {
  python: { ext: '.py', tag: 'python', name: 'Python' },
  python3: { ext: '.py', tag: 'python', name: 'Python 3' },
  py: { ext: '.py', tag: 'python', name: 'Python' },
  javascript: { ext: '.js', tag: 'javascript', name: 'JavaScript' },
  js: { ext: '.js', tag: 'javascript', name: 'JavaScript' },
  typescript: { ext: '.ts', tag: 'typescript', name: 'TypeScript' },
  ts: { ext: '.ts', tag: 'typescript', name: 'TypeScript' },
  java: { ext: '.java', tag: 'java', name: 'Java' },
  'c++': { ext: '.cpp', tag: 'cpp', name: 'C++' },
  cpp: { ext: '.cpp', tag: 'cpp', name: 'C++' },
  c: { ext: '.c', tag: 'c', name: 'C' },
  'c#': { ext: '.cs', tag: 'csharp', name: 'C#' },
  csharp: { ext: '.cs', tag: 'csharp', name: 'C#' },
  cs: { ext: '.cs', tag: 'csharp', name: 'C#' },
  go: { ext: '.go', tag: 'go', name: 'Go' },
  golang: { ext: '.go', tag: 'go', name: 'Go' },
  rust: { ext: '.rs', tag: 'rust', name: 'Rust' },
  rs: { ext: '.rs', tag: 'rust', name: 'Rust' },
  ruby: { ext: '.rb', tag: 'ruby', name: 'Ruby' },
  swift: { ext: '.swift', tag: 'swift', name: 'Swift' },
  kotlin: { ext: '.kt', tag: 'kotlin', name: 'Kotlin' },
  scala: { ext: '.scala', tag: 'scala', name: 'Scala' },
  php: { ext: '.php', tag: 'php', name: 'PHP' },
  dart: { ext: '.dart', tag: 'dart', name: 'Dart' },
  racket: { ext: '.rkt', tag: 'scheme', name: 'Racket' },
  erlang: { ext: '.erl', tag: 'erlang', name: 'Erlang' },
  elixir: { ext: '.ex', tag: 'elixir', name: 'Elixir' },
  sql: { ext: '.sql', tag: 'sql', name: 'SQL' },
  mysql: { ext: '.sql', tag: 'sql', name: 'MySQL' },
  mssql: { ext: '.sql', tag: 'sql', name: 'MS SQL Server' },
  oraclesql: { ext: '.sql', tag: 'sql', name: 'Oracle SQL' },
  postgresql: { ext: '.sql', tag: 'sql', name: 'PostgreSQL' },
  bash: { ext: '.sh', tag: 'bash', name: 'Bash' },
  sh: { ext: '.sh', tag: 'bash', name: 'Bash' },
  pandas: { ext: '.py', tag: 'python', name: 'Pandas (Python)' }
};

function getLanguageDetails(rawLang) {
  if (!rawLang || typeof rawLang !== 'string') {
    return { ext: '.txt', tag: 'text', name: 'Text' };
  }

  const normalized = rawLang.trim().toLowerCase().replace(/\s+/g, '');
  if (LANGUAGE_EXTENSIONS[normalized]) {
    return LANGUAGE_EXTENSIONS[normalized];
  }

  // Substring matching fallback
  for (const [key, details] of Object.entries(LANGUAGE_EXTENSIONS)) {
    if (normalized.includes(key)) {
      return details;
    }
  }

  return { ext: '.txt', tag: 'text', name: rawLang.trim() };
}

function sanitizeProblemFolderName(problemNumber, problemTitle) {
  const num = problemNumber || '0';
  const cleanTitle = (problemTitle || 'Solution')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `${num}-${cleanTitle}`;
}

module.exports = {
  LANGUAGE_EXTENSIONS,
  getLanguageDetails,
  sanitizeProblemFolderName
};
