import { Injectable } from '@angular/core';

import { OutputTimeLogRow, RawTimeLogRow } from '../models/time-log.model';

/** Input columns that map 1-to-1 onto an output column. */
const DIRECT_FIELDS: Array<[keyof RawTimeLogRow, string]> = [
  ['minutes', 'Minutes'],
  ['user', 'User'],
  ['userId', 'User Id'],
  ['workItemId', 'Work Item Id'],
  ['date', 'Date'],
  ['dateWeek', 'Week'],
  ['project', 'Project'],
  ['title', 'Parent Title'],
];

const ACTIVITY_TYPES: Record<string, string> = {
  Meeting: 'Meetings',
  Development: 'Coding',
  Testing: 'Testing',
  'Bug Fix': 'Coding',
  'Bug Fixing': 'Coding',
  'Code Review': 'Code Review',
};

/** Reshapes raw rows into the export structure. Pure — no filtering happens here. */
@Injectable({ providedIn: 'root' })
export class TimeLogTransformerService {
  toOutputRows(rows: RawTimeLogRow[]): OutputTimeLogRow[] {
    return rows.map((row) => this.toOutputRow(row));
  }

  private toOutputRow(row: RawTimeLogRow): OutputTimeLogRow {
    const output = {} as OutputTimeLogRow;

    for (const [inputKey, outputKey] of DIRECT_FIELDS) {
      output[outputKey as keyof OutputTimeLogRow] = row[inputKey] ?? '';
    }

    output['Work Item Title'] = `[${row.title ?? ''}]\n${row.comment ?? ''}`.trim();
    output['Parent Id'] = row.parentId ?? '';
    output['Type'] = ACTIVITY_TYPES[row.type] ?? 'Coding';
    output['Comment'] = row.type === 'Bug Fixing' ? 'Bug' : 'User Story';

    return output;
  }
}
