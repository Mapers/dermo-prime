import { ResolveFn } from '@angular/router';

import { ConsentEntryContext } from '../models/consent.models';

export const qrEntryResolver: ResolveFn<ConsentEntryContext> = (route) => {
  const accessCode = route.queryParamMap.get('accessCode')?.trim() ?? null;
  const rawChannel = route.queryParamMap.get('channel')?.trim().toUpperCase();
  const channel = 'QR';

  if (!accessCode) {
    return {
      accessCode: null,
      channel,
      isValid: false,
      reason: 'missing-access-code'
    };
  }

  if (rawChannel && rawChannel !== channel) {
    return {
      accessCode,
      channel,
      isValid: false,
      reason: 'invalid-channel'
    };
  }

  return {
    accessCode,
    channel,
    isValid: true
  };
};
