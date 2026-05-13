import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  ConsentEntryContext,
  ConsentPageResponse,
  FlowErrorState,
  RequestState,
  SubmitConsentRequest,
  SubmitConsentResponse
} from '../models/consent.models';
import {
  createIncompleteConsentPageError,
  createInvalidAccessError,
  mapHttpError
} from '../utils/error-mapper';
import { generateRequestId } from '../utils/request-id';
import { ConsentApiClient } from './consent-api.client';

@Injectable({
  providedIn: 'root'
})
export class ConsentFlowStore {
  private readonly apiClient = inject(ConsentApiClient);
  private readonly router = inject(Router);

  private readonly lastEntry = signal<ConsentEntryContext | null>(null);
  private readonly sourceUrlSignal = signal<string | null>(null);
  private readonly pageSignal = signal<ConsentPageResponse | null>(null);
  private readonly submissionResultSignal = signal<SubmitConsentResponse | null>(null);
  private readonly loadStateSignal = signal<RequestState>('idle');
  private readonly submitStateSignal = signal<RequestState>('idle');
  private readonly errorSignal = signal<FlowErrorState | null>(null);

  readonly sourceUrl = this.sourceUrlSignal.asReadonly();
  readonly page = this.pageSignal.asReadonly();
  readonly submissionResult = this.submissionResultSignal.asReadonly();
  readonly loadState = this.loadStateSignal.asReadonly();
  readonly submitState = this.submitStateSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadPage(entry: ConsentEntryContext, sourceUrl?: string | null): void {
    this.lastEntry.set(entry);

    if (sourceUrl?.trim()) {
      this.sourceUrlSignal.set(sourceUrl.trim());
    }

    this.pageSignal.set(null);
    this.submissionResultSignal.set(null);
    this.submitStateSignal.set('idle');
    this.errorSignal.set(null);

    if (!entry.isValid || !entry.accessCode) {
      this.loadStateSignal.set('error');
      this.errorSignal.set(createInvalidAccessError());
      return;
    }

    this.loadStateSignal.set('loading');

    this.apiClient.getConsentPage({ accessCode: entry.accessCode, channel: entry.channel }).subscribe({
      next: (page) => {
        if (!page.accessValid) {
          this.pageSignal.set(null);
          this.loadStateSignal.set('error');
          this.errorSignal.set(createInvalidAccessError());
          return;
        }

        if (!isCompleteConsentPage(page)) {
          this.pageSignal.set(null);
          this.loadStateSignal.set('error');
          this.errorSignal.set(createIncompleteConsentPageError());
          return;
        }

        this.pageSignal.set(page);
        this.loadStateSignal.set('success');
      },
      error: (error: unknown) => {
        this.pageSignal.set(null);
        this.loadStateSignal.set('error');
        this.errorSignal.set(mapHttpError(error));
      }
    });
  }

  retryLoad(): void {
    const entry = this.lastEntry();

    if (entry) {
      this.loadPage(entry);
    }
  }

  submitConsent(accepted: boolean): void {
    const page = this.pageSignal();
    const entry = this.lastEntry();

    if (!accepted || !page || !entry?.accessCode || this.submitStateSignal() === 'loading') {
      return;
    }

    const request: SubmitConsentRequest = {
      submissionToken: page.submissionToken,
      accepted: true,
      consentVersion: page.consentVersion,
      channel: entry.channel,
      requestId: generateRequestId()
    };

    this.errorSignal.set(null);
    this.submitStateSignal.set('loading');
    this.submissionResultSignal.set(null);

    this.apiClient.submitConsent(request).subscribe({
      next: async (response: SubmitConsentResponse) => {
        this.submissionResultSignal.set(response);
        this.submitStateSignal.set('success');

        await this.router.navigate(['/result']);
      },
      error: (error: unknown) => {
        this.submitStateSignal.set('error');
        this.errorSignal.set(mapHttpError(error));
      }
    });
  }
}

function isCompleteConsentPage(page: ConsentPageResponse): boolean {
  return Boolean(
    page.accessValid &&
      page.consentVersion?.trim() &&
      page.legalText?.trim() &&
      page.privacyPolicyUrl?.trim() &&
      page.arcoUrl?.trim() &&
      page.acceptanceLabel?.trim() &&
      page.submissionToken?.trim()
  );
}
