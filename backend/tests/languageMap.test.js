const { getLanguageDetails, sanitizeProblemFolderName } = require('../utils/languageMap');

describe('languageMap Utility', () => {
  test('should return correct extension and tag for Python3 and Python', () => {
    const py3 = getLanguageDetails('Python3');
    expect(py3.ext).toBe('.py');
    expect(py3.tag).toBe('python');

    const py = getLanguageDetails('Python');
    expect(py.ext).toBe('.py');
  });

  test('should return correct extension for JavaScript and TypeScript', () => {
    const js = getLanguageDetails('JavaScript');
    expect(js.ext).toBe('.js');
    expect(js.tag).toBe('javascript');

    const ts = getLanguageDetails('TypeScript');
    expect(ts.ext).toBe('.ts');
    expect(ts.tag).toBe('typescript');
  });

  test('should return correct extension for Java, C++, Go, and Rust', () => {
    expect(getLanguageDetails('Java').ext).toBe('.java');
    expect(getLanguageDetails('C++').ext).toBe('.cpp');
    expect(getLanguageDetails('Go').ext).toBe('.go');
    expect(getLanguageDetails('Rust').ext).toBe('.rs');
  });

  test('should return correct extension for SQL, MySQL, PostgreSQL, Bash, and Pandas', () => {
    expect(getLanguageDetails('SQL').ext).toBe('.sql');
    expect(getLanguageDetails('MySQL').ext).toBe('.sql');
    expect(getLanguageDetails('PostgreSQL').ext).toBe('.sql');
    expect(getLanguageDetails('Bash').ext).toBe('.sh');
    expect(getLanguageDetails('Pandas').ext).toBe('.py');
  });

  test('should sanitize problem folder names correctly', () => {
    expect(sanitizeProblemFolderName(1, 'Two Sum')).toBe('1-Two-Sum');
    expect(sanitizeProblemFolderName(20, 'Valid Parentheses')).toBe('20-Valid-Parentheses');
    expect(sanitizeProblemFolderName(121, 'Best Time to Buy & Sell Stock!')).toBe('121-Best-Time-to-Buy-Sell-Stock');
  });
});
