import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { correlationIdInterceptor } from '../interceptors/correlation-id.interceptor';
import { ConsentEntryContext } from '../models/consent.models';
import { ConsentApiClient } from './consent-api.client';
import { ConsentFlowStore } from './consent-flow.store';

describe('ConsentFlowStore', () => {
  let store: ConsentFlowStore;
  let httpController: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        ConsentApiClient,
        ConsentFlowStore,
        provideHttpClient(withInterceptors([correlationIdInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: router
        }
      ]
    });

    store = TestBed.inject(ConsentFlowStore);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should load the consent page for a valid QR entry', () => {
    store.loadPage(createEntryContext());

    const request = httpController.expectOne(
      (match) =>
        match.url === 'http://localhost:8080/api/v1/consent-page' &&
        match.params.get('accessCode') === 'valid-qr-code' &&
        match.params.get('channel') === 'QR'
    );

    expect(request.request.headers.has('X-Correlation-Id')).toBeTrue();

    request.flush({
      accessValid: true,
      channel: 'QR',
      consentVersion: 'v1',
      legalText: 'Texto legal vigente aprobado.',
      privacyPolicyUrl: 'https://example.com/privacy',
      arcoUrl: 'https://example.com/arco',
      acceptanceLabel: 'Acepto expresamente el tratamiento aprobado.',
      submissionToken: 'signed-token'
    });

    expect(store.loadState()).toBe('success');
    expect(store.page()?.consentVersion).toBe('v1');
    expect(store.error()).toBeNull();
  });

  it('should stop the flow locally when the QR entry is invalid', () => {
    store.loadPage({
      accessCode: null,
      channel: 'QR',
      isValid: false,
      reason: 'missing-access-code'
    });

    expect(store.loadState()).toBe('error');
    expect(store.error()?.kind).toBe('invalid-access');
  });

  it('should submit consent and navigate to the result screen', () => {
    store.loadPage(createEntryContext());

    const getRequest = httpController.expectOne('http://localhost:8080/api/v1/consent-page?accessCode=valid-qr-code&channel=QR');
    getRequest.flush({
      accessValid: true,
      channel: 'QR',
      consentVersion: 'v1',
      legalText: 'Texto legal vigente aprobado.',
      privacyPolicyUrl: 'https://example.com/privacy',
      arcoUrl: 'https://example.com/arco',
      acceptanceLabel: 'Acepto expresamente el tratamiento aprobado.',
      submissionToken: 'signed-token'
    });

    store.submitConsent(true);

    const postRequest = httpController.expectOne('http://localhost:8080/api/v1/consents');
    expect(postRequest.request.body.accepted).toBeTrue();
    expect(postRequest.request.body.channel).toBe('QR');
    expect(postRequest.request.body.requestId).toMatch(/.+/);

    postRequest.flush({
      authorizationCode: 'ABCDEF',
      acceptedAt: '2026-05-11T10:30:00Z',
      consentVersion: 'v1',
      status: 'ACCEPTED'
    });

    expect(store.submissionResult()).toEqual({
      authorizationCode: 'ABCDEF',
      acceptedAt: '2026-05-11T10:30:00Z',
      consentVersion: 'v1',
      status: 'ACCEPTED'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/result']);
  });

  it('should clear the confirmed result when a new load starts', () => {
    store.loadPage(createEntryContext());

    const getRequest = httpController.expectOne('http://localhost:8080/api/v1/consent-page?accessCode=valid-qr-code&channel=QR');
    getRequest.flush({
      accessValid: true,
      channel: 'QR',
      consentVersion: 'v1',
      legalText: 'Texto legal vigente aprobado.',
      privacyPolicyUrl: 'https://example.com/privacy',
      arcoUrl: 'https://example.com/arco',
      acceptanceLabel: 'Acepto expresamente el tratamiento aprobado.',
      submissionToken: 'signed-token'
    });

    store.submitConsent(true);

    const postRequest = httpController.expectOne('http://localhost:8080/api/v1/consents');
    postRequest.flush({
      authorizationCode: 'ABCDEF',
      acceptedAt: '2026-05-11T10:30:00Z',
      consentVersion: 'v1',
      status: 'ACCEPTED'
    });

    expect(store.submissionResult()?.authorizationCode).toBe('ABCDEF');

    store.loadPage(createEntryContext());

    const reloadRequest = httpController.expectOne('http://localhost:8080/api/v1/consent-page?accessCode=valid-qr-code&channel=QR');
    expect(store.submissionResult()).toBeNull();

    reloadRequest.flush({
      accessValid: true,
      channel: 'QR',
      consentVersion: 'v1',
      legalText: 'Texto legal vigente aprobado.',
      privacyPolicyUrl: 'https://example.com/privacy',
      arcoUrl: 'https://example.com/arco',
      acceptanceLabel: 'Acepto expresamente el tratamiento aprobado.',
      submissionToken: 'signed-token'
    });
  });

  it('should map generation failures to a visible UI error', () => {
    store.loadPage(createEntryContext());

    const getRequest = httpController.expectOne('http://localhost:8080/api/v1/consent-page?accessCode=valid-qr-code&channel=QR');
    getRequest.flush({
      accessValid: true,
      channel: 'QR',
      consentVersion: 'v1',
      legalText: 'Texto legal vigente aprobado.',
      privacyPolicyUrl: 'https://example.com/privacy',
      arcoUrl: 'https://example.com/arco',
      acceptanceLabel: 'Acepto expresamente el tratamiento aprobado.',
      submissionToken: 'signed-token'
    });

    store.submitConsent(true);

    const postRequest = httpController.expectOne('http://localhost:8080/api/v1/consents');
    postRequest.flush(
      {
        code: 'CODE_GENERATION_FAILED',
        message: 'No fue posible emitir un codigo.'
      },
      {
        status: 422,
        statusText: 'Unprocessable Entity'
      }
    );

    expect(store.submitState()).toBe('error');
    expect(store.error()?.kind).toBe('generation');
  });
});

function createEntryContext(): ConsentEntryContext {
  return {
    accessCode: 'valid-qr-code',
    channel: 'QR',
    isValid: true
  };
}
