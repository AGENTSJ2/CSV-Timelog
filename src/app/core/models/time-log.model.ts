/**
 * A single row exactly as it appears in the uploaded CSV.
 * Header names come straight from the source file, so keys stay camelCase.
 */
export interface RawTimeLogRow {
  minutes: string;
  user: string;
  userId: string;
  workItemId: string;
  date: string;
  dateWeek: string;
  type: string;
  comment: string;
  project: string;
  title: string;
  parentId?: string;
}

/** Column headers of the exported CSV, in output order. */
export const OUTPUT_HEADERS = [
  'Minutes',
  'User',
  'User Id',
  'Work Item Id',
  'Work Item Title',
  'Date',
  'Week',
  'Type',
  'Comment',
  'Project',
  'Parent Id',
  'Parent Title',
] as const;

export type OutputHeader = (typeof OUTPUT_HEADERS)[number];

/** A transformed row, keyed by the output headers. */
export type OutputTimeLogRow = Record<OutputHeader, string>;

/**
 * Everything the user can narrow the data set by. A single filter object drives
 * both the CSV export and the weekly summary, so the two can never disagree.
 *
 * Empty array / empty string always means "no restriction on this dimension".
 */
export interface TimeLogFilter {
  projects: string[];
  users: string[];
  includeKeyword: string;
  includeWorkItemIds: string[];
  excludeWorkItemIds: string[];
}

export const EMPTY_FILTER: TimeLogFilter = {
  projects: [],
  users: [],
  includeKeyword: '',
  includeWorkItemIds: [],
  excludeWorkItemIds: [],
};

/** A distinct value found in the uploaded file, with how often it occurs. */
export interface FacetOption {
  value: string;
  count: number;
}
