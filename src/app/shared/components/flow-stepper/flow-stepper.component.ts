import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-flow-stepper',
  standalone: true,
  template: `
    <nav class="flow-stepper" aria-label="Progreso del flujo">
      <span class="flow-stepper__item" [class.flow-stepper__item--active]="activeStep() === 1">
        <span class="flow-stepper__dot">1</span>
        <span class="flow-stepper__label">Consentimiento</span>
      </span>
      <span class="flow-stepper__line" aria-hidden="true"></span>
      <span class="flow-stepper__item" [class.flow-stepper__item--active]="activeStep() === 2">
        <span class="flow-stepper__dot">2</span>
        <span class="flow-stepper__label">Código</span>
      </span>
    </nav>
  `,
  styles: `:host { display: contents; }`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowStepperComponent {
  readonly activeStep = input.required<1 | 2>();
}
