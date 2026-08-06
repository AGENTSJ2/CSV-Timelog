import { TestBed } from '@angular/core/testing';

import { FileDownloadService } from '../../../core/services/file-download.service';
import { TimeLogStore } from './time-log.store';

/** The sample export, verbatim, so parsing is exercised against real input. */
const SAMPLE_CSV = [
  'minutes\tuser\tuserId\tworkItemId\tdate\tdateWeek\ttype\tcomment\tproject\ttitle',
  '60\tAbhijith SJ\t92055d7a\t1576\t27-07-2026\t2026-W31\tDevelopment\tFuji portal changes for file upload\tInnolab\t[Graphics] Activity Tab Fuji portal Frontend',
  '210\tAbhijith SJ\t92055d7a\t3023\t31-07-2026\t2026-W31\tDevelopment\tCpp intergation\tImage Processing Training\tZoom and Pan',
  '60\tAbhijith SJ\t92055d7a\t4054\t17-07-2026\t2026-W29\tBug Fixing\tFound issue\tInnolab\t[Graphics] Sales upload fails when uploading large datasets.',
  '120\tAbhijith SJ\t92055d7a\t3874\t10-07-2026\t2026-W28\tBug Fixing\tFire base authentication issue\tInnolab\t[Medical] Mobile modification for real time  driver update',
  '60\tAbhijith SJ\t92055d7a\t1528\t22-07-2026\t2026-W30\tMeeting\tInnolab sync\tInnolab\t[Medical] Demo & Meetings',
  '240\tAbhijith SJ\t92055d7a\t4137\t17-07-2026\t2026-W29\tDevelopment\tSetup Open CV and loaded an file\tImage Processing Training\tOpen CV setup',
].join('\n');

function sampleFile(): File {
  return new File([SAMPLE_CSV], 'timelog.csv', { type: 'text/csv' });
}

describe('TimeLogStore', () => {
  let store: TimeLogStore;
  let downloads: Array<{ csv: string; fileName: string }>;

  beforeEach(async () => {
    downloads = [];
    TestBed.configureTestingModule({
      providers: [
        TimeLogStore,
        {
          provide: FileDownloadService,
          useValue: {
            downloadCsv: (csv: string, fileName: string) => downloads.push({ csv, fileName }),
          },
        },
      ],
    });
    store = TestBed.inject(TimeLogStore);
    await store.loadFile(sampleFile());
  });

  it('parses every row and derives the facet options', () => {
    expect(store.status()).toBe('ready');
    expect(store.hasData()).toBeTrue();
    expect(store.stats().totalRows).toBe(6);
    expect(store.projectOptions().map((option) => option.value)).toEqual([
      'Innolab',
      'Image Processing Training',
    ]);
    expect(store.userOptions()).toEqual([{ value: 'Abhijith SJ', count: 6 }]);
  });

  it('totals the minutes of the matched rows as hours', () => {
    expect(store.stats().hours).toBe(12.5);

    store.patchFilter({ projects: ['Image Processing Training'] });
    expect(store.stats().matchedRows).toBe(2);
    expect(store.stats().hours).toBe(7.5);
  });

  it('exports only the filtered rows, named after the selected project', () => {
    store.patchFilter({ projects: ['Image Processing Training'] });
    store.exportCsv();

    expect(downloads.length).toBe(1);
    const [{ csv, fileName }] = downloads;
    expect(fileName).toBe('timelog-Image-Processing-Training.csv');
    expect(csv).toContain('Zoom and Pan');
    expect(csv).toContain('Open CV setup');
    expect(csv).not.toContain('Innolab');
    // Header row plus the two matching rows; the composite title adds a newline
    // inside a quoted field, so count records rather than lines.
    expect(csv.split('"Minutes"').length).toBe(2);
  });

  it('falls back to the generic file name when the export is not project-scoped', () => {
    store.exportCsv();
    expect(downloads[0].fileName).toBe('timelog.csv');
  });

  it('keeps the preview and the export in agreement', () => {
    store.patchFilter({ excludeWorkItemIds: ['1528'] });

    expect(store.markdown()).not.toContain('1528');
    store.exportCsv();
    expect(downloads[0].csv).not.toContain('Innolab sync');
  });

  it('combines the keyword filter with a project selection', () => {
    store.patchFilter({ projects: ['Innolab'], includeKeyword: 'fire base' });

    expect(store.stats().matchedRows).toBe(1);
    expect(store.markdown()).toContain('[3874]');
  });

  it('reports an active filter and clears it on reset', () => {
    expect(store.isFilterActive()).toBeFalse();

    store.patchFilter({ users: ['Abhijith SJ'] });
    expect(store.isFilterActive()).toBeTrue();

    store.resetFilter();
    expect(store.isFilterActive()).toBeFalse();
    expect(store.stats().matchedRows).toBe(6);
  });

  it('drops stale selections when a new file is loaded', async () => {
    store.patchFilter({ projects: ['Innolab'] });
    await store.loadFile(sampleFile());

    expect(store.filter().projects).toEqual([]);
    expect(store.stats().matchedRows).toBe(6);
  });
});
