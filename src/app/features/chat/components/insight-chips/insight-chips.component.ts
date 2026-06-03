import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

@Component({
  selector: 'app-insight-chips',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './insight-chips.component.html',

  styleUrl:
    './insight-chips.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class InsightChipsComponent {

  readonly insights =
    input.required<string[]>();
}