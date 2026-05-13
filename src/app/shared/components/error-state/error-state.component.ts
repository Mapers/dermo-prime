import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly technicalCode = input<string | undefined>();
  readonly retryable = input(false);
  readonly compact = input(false);
  readonly retryLabel = input('Reintentar');

  readonly retryRequested = output<void>();

  onRetry(): void {
    this.retryRequested.emit();
  }
}
