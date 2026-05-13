import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

import { ConsentFlowStore } from '../../core/services/consent-flow.store';
import { ResultPageComponent } from './result-page.component';

describe('ResultPageComponent', () => {
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
  });

  it('should render the generated authorization code and guidance', async () => {
    await TestBed.configureTestingModule({
      imports: [ResultPageComponent],
      providers: [
        {
          provide: ConsentFlowStore,
          useValue: {
            page: signal({
              accessValid: true,
              channel: 'QR',
              consentVersion: 'v1',
              legalText: 'Texto legal vigente aprobado.',
              privacyPolicyUrl: 'https://example.com/privacy',
              arcoUrl: 'https://example.com/arco',
              acceptanceLabel: 'Acepto el tratamiento aprobado.',
              submissionToken: 'signed-token'
            }).asReadonly(),
            submissionResult: signal({
              authorizationCode: 'ABCDEF',
              acceptedAt: '2026-05-11T10:30:00Z',
              consentVersion: 'v1',
              status: 'ACCEPTED' as const
            }).asReadonly(),
            sourceUrl: signal('/?accessCode=valid-qr-code&channel=QR&campaign=source-qr').asReadonly()
          }
        },
        {
          provide: Router,
          useValue: router
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ResultPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const codeTiles = Array.from(compiled.querySelectorAll('.code-card__tile')).map((tile) => tile.textContent?.trim()).join('');

    expect(codeTiles).toBe('ABCDEF');
    expect(compiled.textContent).toContain('Paso 2 de 2');
    expect(compiled.textContent).toContain('canal');
    expect(compiled.textContent).toContain('aceptacion');
    expect(compiled.textContent).toContain('2026-05-11T10:30:00Z');
    expect(compiled.textContent).toContain('Presenta este codigo al personal de atencion');
    expect(compiled.textContent).toContain('no contiene informacion personal');
    expect(compiled.querySelectorAll('.code-card__tile').length).toBe(6);
    expect(compiled.textContent).not.toContain('Copiar codigo');
    expect(compiled.textContent).not.toContain('Codigo valido por');

    const backButton = compiled.querySelector('.secondary-action') as HTMLButtonElement;
    backButton.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/?accessCode=valid-qr-code&channel=QR&campaign=source-qr');
  });

  it('should not render success when the URL contains an invented code without a confirmed flow result', async () => {
    await TestBed.configureTestingModule({
      imports: [ResultPageComponent],
      providers: [
        {
          provide: ConsentFlowStore,
          useValue: {
            page: signal(null).asReadonly(),
            submissionResult: signal(null).asReadonly(),
            sourceUrl: signal(null).asReadonly()
          }
        },
        {
          provide: Router,
          useValue: router
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ResultPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).not.toContain('ZZZZZZ');
    expect(compiled.textContent).toContain('No encontramos un codigo confirmado');
    expect(compiled.textContent).not.toContain('Tu consentimiento fue registrado correctamente');

    const backButton = compiled.querySelector('.secondary-action') as HTMLButtonElement;
    backButton.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
