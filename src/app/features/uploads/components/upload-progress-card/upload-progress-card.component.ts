import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-progress-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-progress-card.component.html',
  styleUrl: './upload-progress-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadProgressCardComponent {

  readonly progress =
    input.required<number>();

  readonly fileName =
    input.required<string>();

  readonly cancel =
    output<void>();
}
