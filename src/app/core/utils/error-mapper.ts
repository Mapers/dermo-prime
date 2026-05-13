import { HttpErrorResponse } from '@angular/common/http';

import { FlowErrorState } from '../models/consent.models';

export function createInvalidAccessError(): FlowErrorState {
  return {
    kind: 'invalid-access',
    title: 'No pudimos validar el QR',
    message:
      'Verifica que el QR corresponda al flujo oficial de consentimiento DERMO PRIME / VISIA o solicita apoyo en el punto de atención.',
    retryable: false,
    technicalCode: 'INVALID_ACCESS'
  };
}

export function createIncompleteConsentPageError(): FlowErrorState {
  return {
    kind: 'processing',
    title: 'La información legal no está disponible',
    message:
      'El servicio no devolvió todos los campos obligatorios del consentimiento. No es posible continuar hasta completar esa configuración.',
    retryable: true,
    technicalCode: 'INCOMPLETE_CONSENT_PAGE'
  };
}

export function mapHttpError(error: unknown): FlowErrorState {
  if (error instanceof HttpErrorResponse) {
    const technicalCode = readTechnicalCode(error);

    if (technicalCode === 'INVALID_ACCESS') {
      return createInvalidAccessError();
    }

    if (technicalCode === 'CODE_GENERATION_FAILED' || error.status === 422) {
      return {
        kind: 'generation',
        title: 'No fue posible generar el código',
        message:
          'Tu aceptación no pudo finalizar correctamente. Intenta nuevamente o solicita apoyo en el punto de atención.',
        retryable: true,
        technicalCode: technicalCode ?? 'CODE_GENERATION_FAILED'
      };
    }

    if (error.status === 0 || error.status === 503) {
      return {
        kind: 'connection',
        title: 'No pudimos conectarnos con el servicio',
        message:
          'Revisa tu conexión e intenta otra vez. No mostraremos un código hasta recibir confirmación real del servicio.',
        retryable: true,
        technicalCode: technicalCode ?? 'TEMPORARY_UNAVAILABLE'
      };
    }

    return {
      kind: 'processing',
      title: 'No pudimos completar la solicitud',
      message:
        (error.error && typeof error.error === 'object' && 'message' in error.error
          ? String(error.error.message)
          : undefined) ??
        'Ocurrió un error durante el procesamiento del consentimiento. Intenta nuevamente en unos segundos.',
      retryable: true,
      technicalCode: technicalCode ?? 'INVALID_REQUEST'
    };
  }

  return {
    kind: 'processing',
    title: 'Ocurrió un error inesperado',
    message:
      'No fue posible completar el flujo de consentimiento. Intenta nuevamente o solicita apoyo en el punto de atención.',
    retryable: true,
    technicalCode: 'UNEXPECTED_ERROR'
  };
}

function readTechnicalCode(error: HttpErrorResponse): string | undefined {
  const payload = error.error;

  if (payload && typeof payload === 'object' && 'code' in payload) {
    return String(payload.code);
  }

  return undefined;
}
