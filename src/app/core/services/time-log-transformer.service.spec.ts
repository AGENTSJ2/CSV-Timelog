import { TestBed } from '@angular/core/testing';

import { RawTimeLogRow } from '../models/time-log.model';
import { TimeLogTransformerService } from './time-log-transformer.service';

function row(overrides: Partial<RawTimeLogRow>): RawTimeLogRow {
  return {
    minutes: '60',
    user: 'Abhijith SJ',
    userId: '92055d7a',
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

describe('TimeLogTransformerService', () => {
  let service: TimeLogTransformerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeLogTransformerService);
  });

  it('maps direct fields onto the output headers', () => {
    const [output] = service.toOutputRows([row({})]);

    expect(output['Minutes']).toBe('60');
    expect(output['User Id']).toBe('92055d7a');
    expect(output['Week']).toBe('2026-W31');
    expect(output['Date']).toBe('27-07-2026');
    expect(output['Parent Title']).toBe('Activity Tab');
  });

  it('builds the composite work item title from title and comment', () => {
    const [output] = service.toOutputRows([row({})]);
    expect(output['Work Item Title']).toBe('[Activity Tab]\nFuji portal changes');
  });

  it('maps activity types, falling back to Coding', () => {
    expect(service.toOutputRows([row({ type: 'Meeting' })])[0]['Type']).toBe('Meetings');
    expect(service.toOutputRows([row({ type: 'Development' })])[0]['Type']).toBe('Coding');
    expect(service.toOutputRows([row({ type: 'Code Review' })])[0]['Type']).toBe('Code Review');
    expect(service.toOutputRows([row({ type: 'Something else' })])[0]['Type']).toBe('Coding');
  });

  it('flags bug fixing rows as Bug and everything else as User Story', () => {
    expect(service.toOutputRows([row({ type: 'Bug Fixing' })])[0]['Comment']).toBe('Bug');
    expect(service.toOutputRows([row({ type: 'Development' })])[0]['Comment']).toBe('User Story');
  });
});
