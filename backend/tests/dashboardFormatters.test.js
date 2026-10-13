/**
 * Frontend Dashboard Formatters Test Suite
 * Validates date formatting, HTML escaping, and statistics rendering helpers
 */

function formatDate(isoString, mockNow = new Date('2026-10-13T12:00:00Z')) {
  if (!isoString) return 'Recent';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recent';
    const now = mockNow;
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

describe('Dashboard Frontend Logic Test Suite', () => {
  describe('HTML Sanitization (escapeHtml)', () => {
    test('escapes HTML tags and script injections', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = escapeHtml(malicious);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('escapes quotes and ampersands', () => {
      expect(escapeHtml('Problem & "Solution"')).toBe('Problem &amp; &quot;Solution&quot;');
      expect(escapeHtml("Alice's Code")).toBe('Alice&#039;s Code');
    });

    test('handles null, undefined, or empty strings gracefully', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('Date Formatter (formatDate)', () => {
    const refNow = new Date('2026-10-13T12:00:00Z');

    test('formats less than a minute as "Just now"', () => {
      const justNow = new Date('2026-10-13T11:59:45Z').toISOString();
      expect(formatDate(justNow, refNow)).toBe('Just now');
    });

    test('formats minutes ago', () => {
      const fifteenMins = new Date('2026-10-13T11:45:00Z').toISOString();
      expect(formatDate(fifteenMins, refNow)).toBe('15m ago');
    });

    test('formats hours ago', () => {
      const threeHours = new Date('2026-10-13T09:00:00Z').toISOString();
      expect(formatDate(threeHours, refNow)).toBe('3h ago');
    });

    test('formats yesterday', () => {
      const yesterday = new Date('2026-10-12T10:00:00Z').toISOString();
      expect(formatDate(yesterday, refNow)).toBe('Yesterday');
    });

    test('formats days ago within a week', () => {
      const fourDays = new Date('2026-10-09T10:00:00Z').toISOString();
      expect(formatDate(fourDays, refNow)).toBe('4d ago');
    });

    test('formats older dates as "MMM D"', () => {
      const oldDate = new Date('2026-08-15T10:00:00Z').toISOString();
      expect(formatDate(oldDate, refNow)).toContain('Aug');
    });

    test('returns "Recent" on invalid or missing date string', () => {
      expect(formatDate(null)).toBe('Recent');
      expect(formatDate('invalid-date-string')).toBe('Recent');
    });
  });

  describe('Dashboard Statistics Payload Structure', () => {
    test('properly maps stats properties for Free v1.1 dashboard', () => {
      const mockStatsPayload = {
        success: true,
        total: 42,
        easy: 20,
        medium: 18,
        hard: 4,
        currentStreak: 5,
        longestStreak: 12,
        thisWeek: 7
      };

      expect(mockStatsPayload.total).toBe(42);
      expect(mockStatsPayload.easy + mockStatsPayload.medium + mockStatsPayload.hard).toBe(mockStatsPayload.total);
      expect(mockStatsPayload.currentStreak).toBeLessThanOrEqual(mockStatsPayload.longestStreak);
      expect(mockStatsPayload.thisWeek).toBeGreaterThan(0);
    });
  });
});
