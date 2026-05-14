import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideLocationMocks } from '@angular/common/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';
import { correlationIdInterceptor } from './core/interceptors/correlation-id.interceptor';
import { ConsentPageComponent } from './features/consent/consent-page.component';
import { ResultPageComponent } from './features/result/result-page.component';
import { environment } from '../environments/environment';
import { ConsentFlowStore } from './core/services/consent-flow.store';

describe('Consent flow integration', () => {
  let httpController: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;
  let store: ConsentFlowStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        provideHttpClient(withInterceptors([correlationIdInterceptor])),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
    store = TestBed.inject(ConsentFlowStore);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should load consent, accept it, and navigate to a confirmed success result only from a valid flow', async () => {
    const originalScannedUrl = '/?accessCode=' + environment.accessCode + '&channel=' + environment.channel + '&campaign=source-qr';

    await harness.navigateByUrl(originalScannedUrl, ConsentPageComponent);

    // Verifica el estado de carga usando la señal pública del store
    expect(store.loadState()).toBe('loading');
    expect(harness.routeNativeElement?.textContent).toContain('Cargando consentimiento');

    const getRequest = httpController.expectOne(
      environment.apiBaseUrl + '/consent-page?accessCode=' + environment.accessCode + '&channel=' + environment.channel
    );
    getRequest.flush(createConsentPageResponse());

    await harness.fixture.whenStable();
    harness.detectChanges();

    // Verifica que la página se haya cargado correctamente usando la señal pública
    expect(store.page()).toEqual(jasmine.objectContaining({
      accessValid: true,
      channel: 'QR',
      consentVersion: 'v1'
    }));

    const consentScreen = harness.routeNativeElement as HTMLElement;
    const consentForm = consentScreen.querySelector('form') as HTMLFormElement | null;
    const submitButton = consentScreen.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const acceptanceCheckbox = consentScreen.querySelector('input[type="checkbox"]') as HTMLInputElement | null;

    expect(consentScreen.textContent).toContain('Consentimiento legal');
    expect(consentForm).withContext('consent form should be rendered').not.toBeNull();
    expect(submitButton).withContext('submit button should be rendered').not.toBeNull();
    expect(acceptanceCheckbox).withContext('checkbox should be rendered').not.toBeNull();
    expect(submitButton?.disabled).toBeTrue();

    acceptanceCheckbox?.click();
    harness.detectChanges();

    expect(submitButton?.disabled).toBeFalse();

    submitButton?.click();
    harness.detectChanges();

    const postRequest = httpController.expectOne(environment.apiBaseUrl + '/consents');
    expect(postRequest.request.body).toEqual(
      jasmine.objectContaining({
        accepted: true,
        channel: 'QR',
        consentVersion: 'v1'
      })
    );
    postRequest.flush(createSubmitConsentResponse());

    await harness.fixture.whenStable();
    harness.detectChanges();

    // Verifica el resultado usando la señal pública del store
    expect(store.submissionResult()).toEqual(jasmine.objectContaining({
      authorizationCode: 'ABCDEF',
      status: 'ACCEPTED'
    }));

    const resultScreen = harness.routeNativeElement as HTMLElement;
    const renderedCode = Array.from(resultScreen.querySelectorAll('.code-card__tile')).map((tile) => tile.textContent?.trim()).join('');

    expect(router.url).toBe('/result');
    expect(resultScreen.textContent).toContain('Tu consentimiento fue registrado correctamente');
    expect(renderedCode).toBe('ABCDEF');
    expect(resultScreen.textContent).toContain('aceptacion');
    expect(resultScreen.textContent).toContain('2026-05-11T10:30:00Z');
    expect(resultScreen.textContent).toContain('Presenta este codigo al personal de atencion');

    const backButton = resultScreen.querySelector('.secondary-action') as HTMLButtonElement | null;
    backButton?.click();

    await harness.fixture.whenStable();
    harness.detectChanges();

    // Verifica que se recargue la página de consentimiento correctamente
    const reloadRequest = httpController.expectOne(
      environment.apiBaseUrl + '/consent-page?accessCode=' + environment.accessCode + '&channel=' + environment.channel
    );
    reloadRequest.flush(createConsentPageResponse());

    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(router.url).toBe(originalScannedUrl);
  });

  it('should show an error state when the result route has no confirmed flow state', async () => {
    await harness.navigateByUrl('/result?code=ZZZZZZ&status=ACCEPTED', ResultPageComponent);

    await harness.fixture.whenStable();
    harness.detectChanges();

    // Verifica el estado de error usando la señal pública del store
    expect(store.error()).not.toBeNull();

    const resultScreen = harness.routeNativeElement as HTMLElement;

    expect(resultScreen.textContent).toContain('No encontramos un codigo confirmado');
    expect(resultScreen.textContent).not.toContain('Tu consentimiento fue registrado correctamente');
    expect(resultScreen.textContent).not.toContain('ZZZZZZ');
  });
});

function createConsentPageResponse() {
  return {
    accessValid: true,
    channel: 'QR',
    consentVersion: 'v1',
    legalText: 'Texto legal vigente aprobado.',
    privacyPolicyUrl: 'https://example.com/privacy',
    arcoUrl: 'https://example.com/arco',
    acceptanceLabel: 'Acepto expresamente el tratamiento aprobado.',
    submissionToken: 'signed-token'
  };
}

function createSubmitConsentResponse() {
  return {
    authorizationCode: 'ABCDEF',
    acceptedAt: '2026-05-11T10:30:00Z',
    consentVersion: 'v1',
    status: 'ACCEPTED' as const
  };
}