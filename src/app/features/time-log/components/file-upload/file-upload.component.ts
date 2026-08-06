import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { LoadStatus } from '../../state/time-log.store';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  readonly fileName = input<string | null>(null);
  readonly status = input<LoadStatus>('idle');
  readonly errorMessage = input<string | null>(null);
  readonly canExport = input(false);
  readonly exportLabel = input('Download Time Log');

  readonly fileSelected = output<File>();
  readonly exportRequested = output<void>();

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
    // Allow re-selecting the same file after an edit on disk.
    input.value = '';
  }
}
