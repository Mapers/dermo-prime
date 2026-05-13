import { Routes } from '@angular/router';

import { qrEntryResolver } from './core/resolvers/qr-entry.resolver';

export const routes: Routes = [
  {
    path: '',
    resolve: {
      entry: qrEntryResolver
    },
    title: 'Consentimiento | DERMO PRIME / VISIA',
    loadComponent: () =>
      import('./features/consent/consent-page.component').then(
        (module) => module.ConsentPageComponent
      )
  },
  {
    path: 'result',
    title: 'Codigo generado | DERMO PRIME / VISIA',
    loadComponent: () =>
      import('./features/result/result-page.component').then(
        (module) => module.ResultPageComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
