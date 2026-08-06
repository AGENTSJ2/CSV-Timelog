import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TimeLogPageComponent } from './features/time-log/time-log-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TimeLogPageComponent],
  template: '<app-time-log-page />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
