const { calculateStreaks, toDateString } = require('../utils/streakCalculator');

describe('streakCalculator Utility', () => {
  test('should return 0 for empty date list', () => {
    const res = calculateStreaks([]);
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(0);
    expect(res.thisWeek).toBe(0);
  });

  test('should correctly compute streak for consecutive days including today', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dayBefore = new Date();
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 2);

    const dates = [today, yesterday, dayBefore];
    const res = calculateStreaks(dates);

    expect(res.currentStreak).toBe(3);
    expect(res.longestStreak).toBe(3);
    expect(res.thisWeek).toBe(3);
  });

  test('should handle longest streak even when current streak is 0', () => {
    const past1 = new Date('2025-01-01T12:00:00Z');
    const past2 = new Date('2025-01-02T12:00:00Z');
    const past3 = new Date('2025-01-03T12:00:00Z');
    const past4 = new Date('2025-01-04T12:00:00Z');

    const res = calculateStreaks([past1, past2, past3, past4]);
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(4);
    expect(res.thisWeek).toBe(0);
  });
});
