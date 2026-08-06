import { TestBed } from '@angular/core/testing';

import { RawTimeLogRow } from '../models/time-log.model';
import { WeeklySummaryService } from './weekly-summary.service';

function row(overrides: Partial<RawTimeLogRow>): RawTimeLogRow {
  return {
    minutes: '60',
    user: 'Abhijith SJ',
    userId: 'u-1',
    workItemId: '1576',
    date: '27-07-2026',
    dateWeek: '2026-W31',
    type: 'Development',
    comment: 'Fuji portal changes',
    project: 'Innolab',
    title: 'Activity Tab',
    ...overrides,
  };
}

describe('WeeklySummaryService', () => {
  let service: WeeklySummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeeklySummaryService);
  });

  it('returns an empty string when there are no rows', () => {
    expect(service.buildMarkdown([])).toBe('');
  });

  it('groups comments for the same work item under one heading', () => {
    const markdown = service.buildMarkdown([
      row({ comment: 'First change' }),
      row({ comment: 'Second change', date: '28-07-2026' }),
    ]);

    expect(markdown).toContain('## Week July 27 2026 - August 2 2026');
    expect(markdown).toContain('#### Worked on [1576] Activity Tab');
    expect(markdown).toContain('- First change');
    expect(markdown).toContain('- Second change');
    expect(markdown.match(/#### Worked on/g)?.length).toBe(1);
  });

  it('orders weeks chronologically', () => {
    const markdown = service.buildMarkdown([
      row({ date: '31-07-2026', comment: 'later week' }),
      row({ date: '17-07-2026', comment: 'earlier week' }),
    ]);

    expect(markdown.indexOf('July 13 2026')).toBeLessThan(markdown.indexOf('July 27 2026'));
  });

  it('collects undated rows at the end instead of dropping them', () => {
    const markdown = service.buildMarkdown([
      row({ date: '', comment: 'no date' }),
      row({ date: '27-07-2026', comment: 'dated' }),
    ]);

    expect(markdown).toContain('## Week Undated entries');
    expect(markdown.indexOf('July 27 2026')).toBeLessThan(markdown.indexOf('Undated entries'));
  });
});
