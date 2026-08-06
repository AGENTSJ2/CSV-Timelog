import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

import { FacetOption, TimeLogFilter } from '../../../../core/models/time-log.model';
import { parseTokenList } from '../../../../core/utils/token-list.util';
import { MultiSelectComponent } from '../../../../shared/ui/multi-select/multi-select.component';

/**
 * Presentational filter bar. The store stays the single source of truth for what
 * is applied; this component renders the filter it is given and emits the change
 * the user made.
 *
 * The two work-item-id fields are the exception: they hold the raw text locally,
 * because echoing the *parsed* token list back into the input would rewrite what
 * the user is typing (eating separators and moving the caret). Only the parsed
 * result leaves the component.
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [MultiSelectComponent],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanelComponent {
  readonly filter = input.required<TimeLogFilter>();
  readonly projectOptions = input<FacetOption[]>([]);
  readonly userOptions = input<FacetOption[]>([]);
  readonly disabled = input(false);
  readonly canReset = input(false);

  readonly filterChange = output<Partial<TimeLogFilter>>();
  readonly resetRequested = output<void>();

  protected readonly includeIdsDraft = signal('');
  protected readonly excludeIdsDraft = signal('');

  constructor() {
    // Adopt filter changes that did not originate here (reset, a new upload)
    // without clobbering in-progress typing, which parses to the same tokens.
    effect(
      () => {
        const filter = this.filter();
        if (!sameTokens(parseTokenList(this.includeIdsDraft()), filter.includeWorkItemIds)) {
          this.includeIdsDraft.set(filter.includeWorkItemIds.join(' '));
        }
        if (!sameTokens(parseTokenList(this.excludeIdsDraft()), filter.excludeWorkItemIds)) {
          this.excludeIdsDraft.set(filter.excludeWorkItemIds.join(' '));
        }
      },
      { allowSignalWrites: true },
    );
  }

  protected onProjectsChange(projects: string[]): void {
    this.filterChange.emit({ projects });
  }

  protected onUsersChange(users: string[]): void {
    this.filterChange.emit({ users });
  }

  protected onKeywordInput(event: Event): void {
    this.filterChange.emit({ includeKeyword: valueOf(event) });
  }

  protected onIncludeIdsInput(event: Event): void {
    const raw = valueOf(event);
    this.includeIdsDraft.set(raw);
    this.filterChange.emit({ includeWorkItemIds: parseTokenList(raw) });
  }

  protected onExcludeIdsInput(event: Event): void {
    const raw = valueOf(event);
    this.excludeIdsDraft.set(raw);
    this.filterChange.emit({ excludeWorkItemIds: parseTokenList(raw) });
  }
}

function valueOf(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

function sameTokens(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((token, index) => token === b[index]);
}
