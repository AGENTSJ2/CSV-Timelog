import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { ClipboardService } from '../../../../core/services/clipboard.service';

export interface PreviewStats {
  totalRows: number;
  matchedRows: number;
  hours: number;
}

@Component({
  selector: 'app-weekly-preview',
  standalone: true,
  templateUrl: './weekly-preview.component.html',
  styleUrl: './weekly-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyPreviewComponent {
  readonly html = input('');
  readonly stats = input<PreviewStats>({ totalRows: 0, matchedRows: 0, hours: 0 });
  readonly hasData = input(false);

  private readonly clipboard = inject(ClipboardService);
  private readonly output = viewChild<ElementRef<HTMLElement>>('output');

  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  /**
   * Copying is done here rather than in the container because the rich-text
   * flavour has to come from the rendered DOM, which only this component owns.
   */
  protected async copy(): Promise<void> {
    const element = this.output()?.nativeElement;
    if (!element) {
      return;
    }

    try {
      await this.clipboard.copyRichText(element.innerHTML, element.innerText);
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
    setTimeout(() => this.copyState.set('idle'), 2000);
  }
}
