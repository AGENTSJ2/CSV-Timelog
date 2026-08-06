import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

/** A selectable value, optionally annotated with how many rows carry it. */
export interface SelectOption {
  value: string;
  count?: number;
}

/**
 * Checkbox dropdown over a list of values.
 *
 * Presentational and domain-agnostic: it knows about `SelectOption`s and a
 * selected-value array, nothing about projects, users or time logs. An empty
 * selection is rendered as the placeholder, which callers use to mean "all".
 */
@Component({
  selector: 'app-multi-select',
  standalone: true,
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly label = input.required<string>();
  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input('All');
  readonly disabled = input(false);

  readonly value = model<string[]>([]);

  protected readonly isOpen = signal(false);

  protected readonly summary = computed(() => {
    const selected = this.value();
    if (!selected.length) {
      return this.placeholder();
    }
    if (selected.length === 1) {
      return selected[0];
    }
    return `${selected.length} selected`;
  });

  protected isSelected(option: SelectOption): boolean {
    return this.value().includes(option.value);
  }

  protected toggleOpen(): void {
    if (!this.disabled()) {
      this.isOpen.update((open) => !open);
    }
  }

  protected toggleOption(option: SelectOption): void {
    this.value.update((selected) =>
      selected.includes(option.value)
        ? selected.filter((item) => item !== option.value)
        : [...selected, option.value],
    );
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.value.set([]);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.isOpen.set(false);
  }
}
