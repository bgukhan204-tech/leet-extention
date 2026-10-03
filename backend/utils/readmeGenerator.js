const { getLanguageDetails } = require('./languageMap');

/**
 * Generate a clean, informative README.md for a LeetCode problem solution
 */
function generateReadme({
  problemNumber,
  problemTitle,
  difficulty,
  language,
  approach,
  timeComplexity,
  spaceComplexity,
  code
}) {
  const langInfo = getLanguageDetails(language);
  const diff = difficulty || 'Easy';
  const num = problemNumber || '1';
  const title = problemTitle || 'Solution';

  const defaultApproach =
    approach ||
    `1. Analyze the constraints and edge cases.\n2. Apply optimal data structures to achieve efficient lookup/traversal.\n3. Return the evaluated result.`;

  const timeComp = timeComplexity || 'O(n)';
  const spaceComp = spaceComplexity || 'O(1)';

  return `# ${num}. ${title}

**Difficulty:** ${diff}  
**Language:** ${langInfo.name}  
**Submission Status:** Accepted  

---

## 📌 Problem Summary
A concise record of the accepted solution for [LeetCode #${num} - ${title}](https://leetcode.com/problems/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/).

---

## 💡 Approach
${defaultApproach}

---

## ⏱️ Complexity Analysis
- **Time Complexity:** \`${timeComp}\`
- **Space Complexity:** \`${spaceComp}\`

---

## 💻 Solution
\`\`\`${langInfo.tag}
${code || '// Code'}
\`\`\`

---
*Auto-generated and committed via [LeetCode2Git](https://github.com).*
`;
}

module.exports = {
  generateReadme
};
