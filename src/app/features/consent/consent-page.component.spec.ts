import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ConsentEntryContext,
  ConsentPageResponse,
  FlowErrorState,
  RequestState
} from '../../core/models/consent.models';
import { ConsentFlowStore } from '../../core/services/consent-flow.store';
import { ConsentPageComponent } from './consent-page.component';

describe('ConsentPageComponent', () => {
  let fixture: ComponentFixture<ConsentPageComponent>;
  let host: HTMLElement;
  let store: MockConsentFlowStore;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    store = new MockConsentFlowStore();
    router = jasmine.createSpyObj<Router>('Router', [], { url: '/?accessCode=valid-qr-code&channel=QR&campaign=source-qr' });

    await TestBed.configureTestingModule({
      imports: [ConsentPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                entry: {
                  accessCode: 'valid-qr-code',
                  channel: 'QR',
                  isValid: true
                } satisfies ConsentEntryContext
              }
            }
          }
        },
        {
          provide: ConsentFlowStore,
          useValue: store
        },
        {
          provide: Router,
          useValue: router
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsentPageComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  it('should load consent page on init', () => {
    fixture.detectChanges();

    expect(store.loadPage).toHaveBeenCalledWith(
      {
        accessCode: 'valid-qr-code',
        channel: 'QR',
        isValid: true
      },
      '/?accessCode=valid-qr-code&channel=QR&campaign=source-qr'
    );
  });

  it('should keep the CTA disabled until acceptance is explicit', () => {
    store.page.set(createConsentPageResponse());
    store.loadState.set('success');

    fixture.detectChanges();

    const submitButton = host.querySelector('button[type="submit"]') as HTMLButtonElement;
    const checkbox = host.querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(submitButton.disabled).toBeTrue();

    checkbox.click();
    fixture.detectChanges();

    expect(submitButton.disabled).toBeFalse();
  });

  it('should submit acceptance after checking the checkbox', () => {
    store.page.set(createConsentPageResponse());
    store.loadState.set('success');

    fixture.detectChanges();

    const checkbox = host.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const submitButton = host.querySelector('button[type="submit"]') as HTMLButtonElement;

    checkbox.click();
    fixture.detectChanges();

    submitButton.click();
    fixture.detectChanges();

    expect(store.submitConsent).toHaveBeenCalledOnceWith(true);
  });

  it('should render the privacy summary inspired by the approved design reference without adding new flow steps', () => {
    store.page.set(createConsentPageResponse());
    store.loadState.set('success');

    fixture.detectChanges();

    expect(host.querySelector('.hero-block__title-row .hero-intro__icon')).not.toBeNull();
    expect(host.textContent).toContain('Paso 1 de 2');
    expect(host.querySelectorAll('.flow-stepper__item').length).toBe(2);
    expect(host.textContent).toContain('Guardamos');
    expect(host.textContent).toContain('Fecha, version y canal');
    expect(host.textContent).toContain('Estado del consentimiento');
    expect(host.textContent).toContain('No guardamos');
    expect(host.textContent).toContain('Nombre, DNI, telefono o correo');
    expect(host.textContent).toContain('Resultados VISIA ni otro dato personal');
    expect(host.textContent).not.toContain('No avanzaremos al resultado si el backend no confirma una operacion valida.');
    expect(host.textContent).not.toContain('Comenzar');
  });

  it('should show validation and avoid submit when the form is sent without explicit acceptance', () => {
    store.page.set(createConsentPageResponse());
    store.loadState.set('success');

    fixture.detectChanges();

    const consentForm = host.querySelector('form') as HTMLFormElement;
    consentForm.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(store.submitConsent).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Debes aceptar expresamente el consentimiento para continuar.');
  });

  it('should render a blocking error when the QR is invalid', () => {
    store.loadState.set('error');
    store.error.set({
      kind: 'invalid-access',
      title: 'No pudimos validar el QR',
      message: 'Error visible para el usuario.',
      retryable: false,
      technicalCode: 'INVALID_ACCESS'
    });

    fixture.detectChanges();

    expect(host.textContent).toContain('No pudimos validar el QR');
    expect(host.textContent).toContain('Error visible para el usuario.');
  });
});

class MockConsentFlowStore {
  readonly page = signal<ConsentPageResponse | null>(null);
  readonly loadState = signal<RequestState>('idle');
  readonly submitState = signal<RequestState>('idle');
  readonly error = signal<FlowErrorState | null>(null);
  readonly loadPage = jasmine.createSpy('loadPage');
  readonly retryLoad = jasmine.createSpy('retryLoad');
  readonly submitConsent = jasmine.createSpy('submitConsent');
}

function createConsentPageResponse(): ConsentPageResponse {
  return {
    accessValid: true,
    channel: 'QR',
    consentVersion: 'v1',
    legalText: 'Texto legal vigente aprobado.',
    privacyPolicyUrl: 'https://example.com/privacy',
    arcoUrl: 'https://example.com/arco',
    acceptanceLabel: 'Acepto el tratamiento de datos segun la politica vigente.',
    submissionToken: 'signed-short-lived-token'
  };
}
