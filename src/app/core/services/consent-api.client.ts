import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ConsentPageRequest,
  ConsentPageResponse,
  SubmitConsentRequest,
  SubmitConsentResponse
} from '../models/consent.models';

@Injectable({
  providedIn: 'root'
})
export class ConsentApiClient {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  getConsentPage(request: ConsentPageRequest): Observable<ConsentPageResponse> {
    const params = new HttpParams({
      fromObject: {
        accessCode: request.accessCode,
        channel: request.channel
      }
    });

    return this.http.get<ConsentPageResponse>(buildEndpointUrl(this.apiBaseUrl, '/consent-page'), {
      params
    });
  }

  submitConsent(request: SubmitConsentRequest): Observable<SubmitConsentResponse> {
    return this.http.post<SubmitConsentResponse>(buildEndpointUrl(this.apiBaseUrl, '/consents'), request);
  }
}

export function buildEndpointUrl(apiBaseUrl: string, endpointPath: `/${string}`): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${endpointPath}`;
}
