import { HttpInterceptorFn } from '@angular/common/http';

import { generateRequestId } from '../utils/request-id';

export const correlationIdInterceptor: HttpInterceptorFn = (request, next) => {
  const correlationId = request.headers.get('X-Correlation-Id') ?? generateRequestId();

  return next(
    request.clone({
      setHeaders: {
        'X-Correlation-Id': correlationId
      }
    })
  );
};
