const { generateReadme } = require('../utils/readmeGenerator');

describe('readmeGenerator Utility', () => {
  test('should format README markdown correctly', () => {
    const readme = generateReadme({
      problemNumber: 1,
      problemTitle: 'Two Sum',
      difficulty: 'Easy',
      language: 'Python',
      approach: 'Use a hash table for fast lookups.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      code: 'def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i'
    });

    expect(readme).toContain('# 1. Two Sum');
    expect(readme).toContain('**Difficulty:** Easy');
    expect(readme).toContain('**Language:** Python');
    expect(readme).toContain('Use a hash table for fast lookups.');
    expect(readme).toContain('Time Complexity:** `O(n)`');
    expect(readme).toContain('Space Complexity:** `O(n)`');
    expect(readme).toContain('```python');
    expect(readme).toContain('def twoSum(nums, target):');
  });
});
