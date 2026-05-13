import { buildEndpointUrl } from './consent-api.client';

describe('buildEndpointUrl', () => {
  it('should keep a development host and append the endpoint once', () => {
    expect(buildEndpointUrl('http://localhost:8080/api/v1', '/consent-page')).toBe(
      'http://localhost:8080/api/v1/consent-page'
    );
  });

  it('should keep the production reverse-proxy base path and avoid duplicating /api', () => {
    expect(buildEndpointUrl('/api/v1', '/consents')).toBe('/api/v1/consents');
  });

  it('should normalize a trailing slash in the configured base url', () => {
    expect(buildEndpointUrl('/api/v1/', '/consents')).toBe('/api/v1/consents');
  });
});
