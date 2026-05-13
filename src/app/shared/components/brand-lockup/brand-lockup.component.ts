import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-brand-lockup',
  standalone: true,
  template: `
    <div class="brand-lockup" aria-label="Marca del flujo DERMO PRIME / VISIA">
      <div class="brand-lockup__wordmark">
        <span class="brand-lockup__name">DERMO</span>
        <span class="brand-lockup__badge">PRIME</span>
      </div>
    </div>
  `,
  styles: `:host { display: contents; }`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandLockupComponent {}
