import { formatWeekRange, getWeekRange, parseTimeLogDate, weekKey } from './date.util';

describe('parseTimeLogDate', () => {
  it('parses the day-first format the export emits', () => {
    const date = parseTimeLogDate('27-07-2026')!;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6); // July
    expect(date.getDate()).toBe(27);
  });

  it('treats an ambiguous value as day-first', () => {
    const date = parseTimeLogDate('10-07-2026')!;
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(10);
  });

  it('swaps when the second component cannot be a month', () => {
    const date = parseTimeLogDate('07-27-2026')!;
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(27);
  });

  it('parses ISO dates', () => {
    const date = parseTimeLogDate('2026-07-27')!;
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(27);
  });

  it('returns null for blank or unparseable input', () => {
    expect(parseTimeLogDate('')).toBeNull();
    expect(parseTimeLogDate('not a date')).toBeNull();
    expect(parseTimeLogDate('32-01-2026')).toBeNull();
  });
});

describe('getWeekRange', () => {
  it('spans Monday to Sunday around a mid-week date', () => {
    const range = getWeekRange(parseTimeLogDate('31-07-2026')!); // a Friday
    expect(range.start.getDate()).toBe(27);
    expect(range.end.getDate()).toBe(2); // 2 August
    expect(weekKey(range)).toBe('2026-07-27');
    expect(formatWeekRange(range)).toBe('July 27 2026 - August 2 2026');
  });

  it('keeps a Sunday in the week that started the previous Monday', () => {
    const range = getWeekRange(parseTimeLogDate('02-08-2026')!); // a Sunday
    expect(weekKey(range)).toBe('2026-07-27');
  });
});
