import { Injectable } from '@angular/core';

import { FacetOption, RawTimeLogRow, TimeLogFilter } from '../models/time-log.model';
import { parseTokenList } from '../utils/token-list.util';

/**
 * The single place that decides which rows survive. Both the CSV export and the
 * weekly summary consume its output, so the download can never contain rows the
 * preview hid (or vice versa).
 *
 * Every dimension is AND-ed together; within a dimension, values are OR-ed.
 * An empty selection means "don't restrict on this dimension".
 */
@Injectable({ providedIn: 'root' })
export class TimeLogFilterService {
  apply(rows: RawTimeLogRow[], filter: TimeLogFilter): RawTimeLogRow[] {
    const projects = new Set(filter.projects);
    const users = new Set(filter.users);
    const included = new Set(filter.includeWorkItemIds);
    const excluded = new Set(filter.excludeWorkItemIds);
    const keywords = parseKeywords(filter.includeKeyword);

    return rows.filter((row) => {
      if (projects.size && !projects.has(row.project)) {
        return false;
      }
      if (users.size && !users.has(row.user)) {
        return false;
      }
      // Include runs before exclude, so an id in both lists is excluded.
      if (included.size && !included.has(row.workItemId)) {
        return false;
      }
      if (excluded.has(row.workItemId)) {
        return false;
      }
      if (keywords.length && !matchesAnyKeyword(row, keywords)) {
        return false;
      }
      return true;
    });
  }

  /** Distinct projects in the uploaded file, most-logged first. */
  projectOptions(rows: RawTimeLogRow[]): FacetOption[] {
    return facet(rows, (row) => row.project);
  }

  /** Distinct users in the uploaded file, most-logged first. */
  userOptions(rows: RawTimeLogRow[]): FacetOption[] {
    return facet(rows, (row) => row.user);
  }
}

/**
 * A keyword phrase may contain spaces, so only commas and semicolons split the
 * field. Matching is case-insensitive and OR-ed across phrases.
 */
function parseKeywords(raw: string): string[] {
  return (raw ?? '')
    .split(/[,;]+/)
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

function matchesAnyKeyword(row: RawTimeLogRow, keywords: string[]): boolean {
  const haystack = [row.title, row.comment, row.type, row.project, row.workItemId]
    .join(' ')
    .toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function facet(rows: RawTimeLogRow[], pick: (row: RawTimeLogRow) => string): FacetOption[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = pick(row).trim();
    if (!value) {
      continue;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (a, b) => b.count - a.count || a.value.localeCompare(b.value),
  );
}
