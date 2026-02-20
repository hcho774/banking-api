import { getStartOfDay } from './date.util';

describe('getStartOfDay', () => {
  it('should return start of day for a given date', () => {
    const date = new Date('2026-02-20T15:30:45.123Z');
    const result = getStartOfDay(date);

    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('should not mutate the original date', () => {
    const date = new Date('2026-02-20T15:30:45.123Z');
    const originalTime = date.getTime();
    getStartOfDay(date);

    expect(date.getTime()).toBe(originalTime);
  });

  it('should default to current date when no argument', () => {
    const before = new Date();
    before.setHours(0, 0, 0, 0);

    const result = getStartOfDay();

    expect(result.getTime()).toBe(before.getTime());
  });

  it('should handle midnight correctly', () => {
    const midnight = new Date('2026-02-20T00:00:00.000');
    const result = getStartOfDay(midnight);

    expect(result.getTime()).toBe(midnight.getTime());
  });
});
