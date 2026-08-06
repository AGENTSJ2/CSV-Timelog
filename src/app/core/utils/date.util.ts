export interface WeekRange {
  start: Date;
  end: Date;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_FIRST = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;
const YEAR_FIRST = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/;

/**
 * Parses the date formats the time log export actually emits.
 *
 * `new Date('27-07-2026')` is Invalid Date in every browser, so the day-first
 * format used by the source system has to be handled explicitly. When both
 * components are <= 12 the value is ambiguous and we assume day-first, which is
 * what the export produces; a value > 12 in either slot disambiguates it.
 */
export function parseTimeLogDate(value: string | undefined | null): Date | null {
  const raw = (value ?? '').trim();
  if (!raw) {
    return null;
  }

  const dayFirst = DAY_FIRST.exec(raw);
  if (dayFirst) {
    let day = Number(dayFirst[1]);
    let month = Number(dayFirst[2]);
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    return atMidnight(Number(dayFirst[3]), month - 1, day);
  }

  const yearFirst = YEAR_FIRST.exec(raw);
  if (yearFirst) {
    return atMidnight(Number(yearFirst[1]), Number(yearFirst[2]) - 1, Number(yearFirst[3]));
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** The ISO week (Monday 00:00 → Sunday 23:59:59.999) that contains `date`. */
export function getWeekRange(date: Date): WeekRange {
  const isoDay = date.getDay() === 0 ? 7 : date.getDay();

  const start = new Date(date);
  start.setDate(date.getDate() - isoDay + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/** Stable, sortable key for a week range. */
export function weekKey(range: WeekRange): string {
  return toIsoDate(range.start);
}

export function formatWeekRange(range: WeekRange): string {
  return `${formatLongDate(range.start)} - ${formatLongDate(range.end)}`;
}

function formatLongDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function atMidnight(year: number, monthIndex: number, day: number): Date | null {
  const date = new Date(year, monthIndex, day);
  date.setHours(0, 0, 0, 0);
  const valid =
    date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day;
  return valid ? date : null;
}
