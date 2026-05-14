import { ConsentChannel } from "../../app/core/models/consent.models";

export const variablesConfig = {
  production: true,
  apiBaseUrl: 'https://welfare-lane-models-assured.trycloudflare.com/api/v1',
  brandName: 'DERMO PRIME / VISIA',

  accessCode: 'QR-MIFARMA-001',
  channel: 'QR' as ConsentChannel,
  consentVersion: 'v1'
};