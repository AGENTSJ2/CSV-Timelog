import { Injectable } from '@angular/core';

import { RawTimeLogRow } from '../models/time-log.model';
import { formatWeekRange, getWeekRange, parseTimeLogDate, weekKey } from '../utils/date.util';

interface WeekBucket {
  label: string;
  /** Work item heading → the comments logged against it that week. */
  items: Map<string, string[]>;
}

/** Sorts after any real `YYYY-MM-DD` week key, so undated rows land last. */
const UNDATED_KEY = '9999-99-99';

/**
 * Builds the markdown weekly report. Receives rows that are already filtered —
 * it has no opinion about which rows belong in the report.
 */
@Injectable({ providedIn: 'root' })
export class WeeklySummaryService {
  buildMarkdown(rows: RawTimeLogRow[]): string {
    const weeks = this.groupByWeek(rows);
    if (!weeks.size) {
      return '';
    }

    const sorted = Array.from(weeks.entries()).sort(([a], [b]) => a.localeCompare(b));

    let markdown = '';
    for (const [, bucket] of sorted) {
      markdown += `\n## Week ${bucket.label}\n`;
      for (const [heading, comments] of bucket.items) {
        markdown += `#### Worked on ${heading}\n`;
        for (const comment of comments) {
          markdown += `- ${comment}\n`;
        }
      }
    }
    return markdown;
  }

  private groupByWeek(rows: RawTimeLogRow[]): Map<string, WeekBucket> {
    const weeks = new Map<string, WeekBucket>();

    for (const row of rows) {
      const date = parseTimeLogDate(row.date);
      // Rows with an unparseable date still belong in the report — they are
      // collected at the end rather than silently dropped.
      const key = date ? weekKey(getWeekRange(date)) : UNDATED_KEY;
      const label = date ? formatWeekRange(getWeekRange(date)) : 'Undated entries';

      let bucket = weeks.get(key);
      if (!bucket) {
        bucket = { label, items: new Map() };
        weeks.set(key, bucket);
      }

      const heading = `[${row.workItemId}] ${row.title}`;
      const comment = row.comment?.trim();
      if (!comment) {
        // Keep the heading so the work item still shows up in the report.
        if (!bucket.items.has(heading)) {
          bucket.items.set(heading, []);
        }
        continue;
      }

      const comments = bucket.items.get(heading);
      if (comments) {
        comments.push(comment);
      } else {
        bucket.items.set(heading, [comment]);
      }
    }

    return weeks;
  }
}
