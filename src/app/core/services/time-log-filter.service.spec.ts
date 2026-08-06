import { TestBed } from '@angular/core/testing';

import { EMPTY_FILTER, RawTimeLogRow, TimeLogFilter } from '../models/time-log.model';
import { TimeLogFilterService } from './time-log-filter.service';

function row(overrides: Partial<RawTimeLogRow>): RawTimeLogRow {
  return {
    minutes: '60',
    user: 'Abhijith SJ',
    userId: 'u-1',
    workItemId: '1576',
    date: '27-07-2026',
    dateWeek: '2026-W31',
    type: 'Development',
    comment: 'Fuji portal changes for file upload',
    project: 'Innolab',
    title: '[Graphics] Activity Tab Fuji portal Frontend',
    ...overrides,
  };
}

function filterWith(overrides: Partial<TimeLogFilter>): TimeLogFilter {
  return { ...EMPTY_FILTER, ...overrides };
}

describe('TimeLogFilterService', () => {
  let service: TimeLogFilterService;

  const rows: RawTimeLogRow[] = [
    row({ workItemId: '1576', project: 'Innolab', user: 'Abhijith SJ' }),
    row({
      workItemId: '3023',
      project: 'Image Processing Training',
      user: 'Abhijith SJ',
      comment: 'Cpp intergation',
      title: 'Zoom and Pan',
      minutes: '210',
    }),
    row({
      workItemId: '4054',
      project: 'Innolab',
      user: 'Priya R',
      type: 'Bug Fixing',
      comment: 'Found issue',
      title: '[Graphics] Sales upload fails when uploading large datasets.',
    }),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeLogFilterService);
  });

  it('keeps every row when no filter is set', () => {
    expect(service.apply(rows, EMPTY_FILTER).length).toBe(3);
  });

  it('keeps only the selected projects', () => {
    const result = service.apply(rows, filterWith({ projects: ['Innolab'] }));
    expect(result.map((r) => r.workItemId)).toEqual(['1576', '4054']);
  });

  it('ORs multiple selected projects together', () => {
    const result = service.apply(
      rows,
      filterWith({ projects: ['Innolab', 'Image Processing Training'] }),
    );
    expect(result.length).toBe(3);
  });

  it('ANDs project and user together', () => {
    const result = service.apply(
      rows,
      filterWith({ projects: ['Innolab'], users: ['Abhijith SJ'] }),
    );
    expect(result.map((r) => r.workItemId)).toEqual(['1576']);
  });

  it('matches the include keyword case-insensitively across title and comment', () => {
    expect(service.apply(rows, filterWith({ includeKeyword: 'CPP' })).length).toBe(1);
    expect(service.apply(rows, filterWith({ includeKeyword: 'sales upload' })).length).toBe(1);
  });

  it('treats comma-separated keywords as any-of', () => {
    const result = service.apply(rows, filterWith({ includeKeyword: 'cpp, sales upload' }));
    expect(result.map((r) => r.workItemId)).toEqual(['3023', '4054']);
  });

  it('keeps only the included work item ids', () => {
    const result = service.apply(rows, filterWith({ includeWorkItemIds: ['3023', '4054'] }));
    expect(result.map((r) => r.workItemId)).toEqual(['3023', '4054']);
  });

  it('lets exclude win over include for the same id', () => {
    const result = service.apply(
      rows,
      filterWith({ includeWorkItemIds: ['3023', '4054'], excludeWorkItemIds: ['4054'] }),
    );
    expect(result.map((r) => r.workItemId)).toEqual(['3023']);
  });

  it('derives project options ordered by frequency', () => {
    expect(service.projectOptions(rows)).toEqual([
      { value: 'Innolab', count: 2 },
      { value: 'Image Processing Training', count: 1 },
    ]);
  });

  it('derives distinct user options', () => {
    expect(service.userOptions(rows).map((option) => option.value)).toEqual([
      'Abhijith SJ',
      'Priya R',
    ]);
  });
});
