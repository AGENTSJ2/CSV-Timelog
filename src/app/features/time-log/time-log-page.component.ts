import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { TimeLogFilter } from '../../core/models/time-log.model';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { FilterPanelComponent } from './components/filter-panel/filter-panel.component';
import { WeeklyPreviewComponent } from './components/weekly-preview/weekly-preview.component';
import { TimeLogStore } from './state/time-log.store';

/**
 * Container for the time log screen. Owns the store, wires signals into the
 * presentational children, and forwards their events back as store intents.
 */
@Component({
  selector: 'app-time-log-page',
  standalone: true,
  imports: [FileUploadComponent, FilterPanelComponent, WeeklyPreviewComponent],
  providers: [TimeLogStore],
  templateUrl: './time-log-page.component.html',
  styleUrl: './time-log-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogPageComponent {
  protected readonly store = inject(TimeLogStore);

  /** Makes it obvious that the download honours the project filter. */
  protected readonly exportLabel = computed(() => {
    const projects = this.store.filter().projects;
    if (projects.length === 1) {
      return `Download ${projects[0]}`;
    }
    if (projects.length > 1) {
      return `Download ${projects.length} projects`;
    }
    return 'Download Time Log';
  });

  protected onFileSelected(file: File): void {
    void this.store.loadFile(file);
  }

  protected onFilterChange(patch: Partial<TimeLogFilter>): void {
    this.store.patchFilter(patch);
  }
}
