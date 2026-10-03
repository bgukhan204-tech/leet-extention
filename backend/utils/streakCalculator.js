/**
 * Calculate user streaks and weekly statistics based on solution timestamps
 */

function toDateString(d) {
  const date = new Date(d);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreaks(dates = []) {
  if (!dates || dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, thisWeek: 0 };
  }

  // Extract unique sorted date strings (descending)
  const uniqueDateStrings = Array.from(
    new Set(dates.map((d) => toDateString(d)))
  ).sort((a, b) => (a < b ? 1 : -1));

  if (uniqueDateStrings.length === 0) {
    return { currentStreak: 0, longestStreak: 0, thisWeek: 0 };
  }

  const todayStr = toDateString(new Date());
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = toDateString(yesterday);

  // Calculate current streak
  let currentStreak = 0;
  const firstDate = uniqueDateStrings[0];

  // Current streak is valid if the most recent solution is today or yesterday
  if (firstDate === todayStr || firstDate === yesterdayStr) {
    currentStreak = 1;
    let expectedPrev = new Date(firstDate);

    for (let i = 1; i < uniqueDateStrings.length; i++) {
      expectedPrev.setUTCDate(expectedPrev.getUTCDate() - 1);
      const expectedStr = toDateString(expectedPrev);

      if (uniqueDateStrings[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across all history
  // Sort ascending for consecutive check
  const ascDates = [...uniqueDateStrings].reverse();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDateObj = null;

  for (const dateStr of ascDates) {
    const curDateObj = new Date(dateStr);
    if (!prevDateObj) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curDateObj - prevDateObj) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDateObj = curDateObj;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // Calculate this week's count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const thisWeek = dates.filter((d) => new Date(d) >= sevenDaysAgo).length;

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    thisWeek
  };
}

module.exports = {
  calculateStreaks,
  toDateString
};
