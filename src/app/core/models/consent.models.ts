export type ConsentChannel = 'QR';

export type RequestState = 'idle' | 'loading' | 'success' | 'error';

export interface ConsentEntryContext {
  accessCode: string | null;
  channel: ConsentChannel;
  isValid: boolean;
  reason?: 'missing-access-code' | 'invalid-channel';
}

export interface ConsentPageRequest {
  accessCode: string;
  channel: ConsentChannel;
}

export interface ConsentPageResponse {
  accessValid: boolean;
  channel: string;
  consentVersion: string;
  legalText: string;
  privacyPolicyUrl: string;
  arcoUrl: string;
  acceptanceLabel: string;
  submissionToken: string;
}

export interface SubmitConsentRequest {
  submissionToken: string;
  accepted: true;
  consentVersion: string;
  channel: ConsentChannel;
  requestId: string;
}

export interface SubmitConsentResponse {
  authorizationCode: string;
  acceptedAt: string;
  consentVersion: string;
  status: 'ACCEPTED';
}

export interface FlowErrorState {
  kind: 'invalid-access' | 'connection' | 'generation' | 'processing';
  title: string;
  message: string;
  retryable: boolean;
  technicalCode?: string;
}
