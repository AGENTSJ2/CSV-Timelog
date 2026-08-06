import { computed, inject, Injectable, signal } from '@angular/core';

import { CsvParserService } from '../../../core/services/csv-parser.service';
import { FileDownloadService } from '../../../core/services/file-download.service';
import { MarkdownService } from '../../../core/services/markdown.service';
import { TimeLogFilterService } from '../../../core/services/time-log-filter.service';
import { TimeLogTransformerService } from '../../../core/services/time-log-transformer.service';
import { WeeklySummaryService } from '../../../core/services/weekly-summary.service';
import {
  EMPTY_FILTER,
  OUTPUT_HEADERS,
  RawTimeLogRow,
  TimeLogFilter,
} from '../../../core/models/time-log.model';

export type LoadStatus = 'idle' | 'parsing' | 'ready' | 'error';

/**
 * Feature state for the time log screen.
 *
 * Provided by `TimeLogPageComponent` rather than in root: its lifetime is the
 * screen's lifetime. Components read signals and call intents; nothing outside
 * this class mutates state.
 *
 * The pipeline is a chain of computeds — raw rows → filtered rows → markdown →
 * html — so changing any filter recomputes only what depends on it, and the
 * export and the preview are guaranteed to be built from the same rows.
 */
@Injectable()
export class TimeLogStore {
  private readonly parser = inject(CsvParserService);
  private readonly transformer = inject(TimeLogTransformerService);
  private readonly filterService = inject(TimeLogFilterService);
  private readonly summary = inject(WeeklySummaryService);
  private readonly markdownService = inject(MarkdownService);
  private readonly downloader = inject(FileDownloadService);

  private readonly rows = signal<RawTimeLogRow[]>([]);
  private readonly _filter = signal<TimeLogFilter>(EMPTY_FILTER);
  private readonly _status = signal<LoadStatus>('idle');
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _fileName = signal<string | null>(null);

  readonly filter = this._filter.asReadonly();
  readonly status = this._status.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly fileName = this._fileName.asReadonly();

  readonly hasData = computed(() => this.rows().length > 0);
  readonly projectOptions = computed(() => this.filterService.projectOptions(this.rows()));
  readonly userOptions = computed(() => this.filterService.userOptions(this.rows()));

  readonly filteredRows = computed(() => this.filterService.apply(this.rows(), this._filter()));

  readonly markdown = computed(() => this.summary.buildMarkdown(this.filteredRows()));
  readonly previewHtml = computed(() => this.markdownService.toSafeHtml(this.markdown()));

  readonly stats = computed(() => {
    const filtered = this.filteredRows();
    const minutes = filtered.reduce((total, row) => total + (Number(row.minutes) || 0), 0);
    return {
      totalRows: this.rows().length,
      matchedRows: filtered.length,
      hours: Math.round((minutes / 60) * 100) / 100,
    };
  });

  readonly isFilterActive = computed(() => {
    const filter = this._filter();
    return (
      filter.projects.length > 0 ||
      filter.users.length > 0 ||
      filter.includeKeyword.trim().length > 0 ||
      filter.includeWorkItemIds.length > 0 ||
      filter.excludeWorkItemIds.length > 0
    );
  });

  async loadFile(file: File): Promise<void> {
    this._status.set('parsing');
    this._errorMessage.set(null);
    this._fileName.set(file.name);

    try {
      const parsed = await this.parser.parseFile(file);
      this.rows.set(parsed);
      // A new file's projects and users are different; stale selections would
      // silently match nothing.
      this._filter.set(EMPTY_FILTER);
      this._status.set('ready');
    } catch (error) {
      this.rows.set([]);
      this._status.set('error');
      this._errorMessage.set(
        error instanceof Error ? error.message : 'Failed to parse the CSV file.',
      );
    }
  }

  patchFilter(patch: Partial<TimeLogFilter>): void {
    this._filter.update((current) => ({ ...current, ...patch }));
  }

  resetFilter(): void {
    this._filter.set(EMPTY_FILTER);
  }

  /** Exports exactly the rows the preview is showing. */
  exportCsv(): void {
    const outputRows = this.transformer.toOutputRows(this.filteredRows());
    const csv = this.parser.toCsv(outputRows, OUTPUT_HEADERS);
    this.downloader.downloadCsv(csv, this.exportFileName());
  }

  /** `timelog-Innolab.csv` when scoped to one project/user, `timelog.csv` otherwise. */
  private exportFileName(): string {
    const { projects, users } = this._filter();
    const scope = [
      projects.length === 1 ? projects[0] : null,
      users.length === 1 ? users[0] : null,
    ].filter((part): part is string => Boolean(part));

    const suffix = scope.map(toFileNameSafe).filter(Boolean).join('-');
    return suffix ? `timelog-${suffix}.csv` : 'timelog.csv';
  }
}

function toFileNameSafe(value: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}
