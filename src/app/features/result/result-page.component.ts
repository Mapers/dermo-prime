import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ConsentFlowStore } from '../../core/services/consent-flow.store';
import { BrandLockupComponent } from '../../shared/components/brand-lockup/brand-lockup.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { FlowStepperComponent } from '../../shared/components/flow-stepper/flow-stepper.component';

@Component({
  selector: 'app-result-page',
  standalone: true,
  imports: [CommonModule, ErrorStateComponent, BrandLockupComponent, FlowStepperComponent],
  templateUrl: './result-page.component.html',
  styleUrl: './result-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultPageComponent {
  private readonly consentFlowStore = inject(ConsentFlowStore);
  private readonly router = inject(Router);

  protected readonly page = this.consentFlowStore.page;
  protected readonly result = this.consentFlowStore.submissionResult;
  protected readonly sourceUrl = this.consentFlowStore.sourceUrl;
  protected readonly hasValidCode = computed(() => {
    const result = this.result();

    return Boolean(
      result &&
        result.status === 'ACCEPTED' &&
        result.acceptedAt &&
        result.consentVersion &&
        /^[A-Z]{6}$/.test(result.authorizationCode)
      );
  });
  protected readonly confirmedResult = computed(() => (this.hasValidCode() ? this.result() : null));
  protected readonly codeCharacters = computed(() => this.confirmedResult()?.authorizationCode.split('') ?? []);

  protected onBack(): void {
    void this.router.navigateByUrl(this.sourceUrl() ?? '/');
  }
}
