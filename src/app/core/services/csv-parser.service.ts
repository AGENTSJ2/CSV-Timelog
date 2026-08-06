import { Injectable } from '@angular/core';
import Papa from 'papaparse';

import { RawTimeLogRow } from '../models/time-log.model';

/**
 * Thin boundary around Papa Parse. Keeping the library behind a service means
 * the rest of the app depends on `RawTimeLogRow[]`, not on a parser.
 */
@Injectable({ providedIn: 'root' })
export class CsvParserService {
  parseFile(file: File): Promise<RawTimeLogRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        // Header casing/whitespace drifts between exports; normalise once here.
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
        complete: (results) => resolve(results.data.map(toRawRow)),
        error: (error) => reject(error),
      });
    });
  }

  toCsv(rows: Record<string, string>[], columns: readonly string[]): string {
    return Papa.unparse(rows, {
      columns: columns as string[],
      quotes: true,
    });
  }
}

function toRawRow(row: Record<string, string>): RawTimeLogRow {
  return {
    minutes: row['minutes'] ?? '',
    user: row['user'] ?? '',
    userId: row['userId'] ?? '',
    workItemId: row['workItemId'] ?? '',
    date: row['date'] ?? '',
    dateWeek: row['dateWeek'] ?? '',
    type: row['type'] ?? '',
    comment: row['comment'] ?? '',
    project: row['project'] ?? '',
    title: row['title'] ?? '',
    parentId: row['parentId'] ?? '',
  };
}
