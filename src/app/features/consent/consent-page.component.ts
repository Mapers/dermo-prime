import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ConsentChannel, ConsentEntryContext } from '../../core/models/consent.models';
import { ConsentFlowStore } from '../../core/services/consent-flow.store';
import { BrandLockupComponent } from '../../shared/components/brand-lockup/brand-lockup.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { FlowStepperComponent } from '../../shared/components/flow-stepper/flow-stepper.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-consent-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ErrorStateComponent, BrandLockupComponent, FlowStepperComponent],
  templateUrl: './consent-page.component.html',
  styleUrl: './consent-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsentPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly store = inject(ConsentFlowStore);
  protected readonly consentForm = new FormGroup({
    accepted: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue]
    })
  });
  protected readonly acceptanceControl = this.consentForm.controls.accepted;
  //protected readonly entry = this.route.snapshot.data['entry'] as ConsentEntryContext;
  consentChannel:  ConsentChannel = environment.channel;

  baseEntry: ConsentEntryContext = {
      accessCode: environment.accessCode,
      channel: environment.channel,
      isValid: true,
      reason: 'invalid-channel'
  };
  
  protected readonly entry = this.baseEntry;

  protected readonly submitButtonText = computed(() =>
    this.store.submitState() === 'loading' ? 'Procesando...' : 'Aceptar y continuar'
  );

  protected readonly showBlockingError = computed(
    () => this.store.loadState() === 'error' && !this.store.page()
  );

  ngOnInit(): void {
    this.store.loadPage(this.entry, this.router.url);
  }

  protected onRetryLoad(): void {
    this.store.retryLoad();
  }

  protected onSubmit(): void {
    if (this.consentForm.invalid) {
      this.consentForm.markAllAsTouched();
      return;
    }

    this.store.submitConsent(this.acceptanceControl.getRawValue());
  }
}
