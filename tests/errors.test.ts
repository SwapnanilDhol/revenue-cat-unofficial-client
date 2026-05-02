import { describe, it, expect } from 'vitest';
import { RevenueCatError, RevenueCatConfigError } from '../src/errors';
import type { RevenueCatApiError } from '../src/types';

describe('RevenueCatError', () => {
  it('creates error with status code and body', () => {
    const errorBody: RevenueCatApiError = {
      object: 'error',
      type: 'parameter_error',
      message: 'Invalid parameter',
      doc_url: 'https://errors.rev.cat/parameter-error',
      retryable: false,
    };

    const error = new RevenueCatError(400, errorBody);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RevenueCatError);
    expect(error.name).toBe('RevenueCatError');
    expect(error.statusCode).toBe(400);
    expect(error.body).toEqual(errorBody);
    expect(error.message).toBe('Invalid parameter');
  });

  it('uses statusText when message is not in body', () => {
    const error = new RevenueCatError(404, { message: 'Not Found' });

    expect(error.message).toBe('Not Found');
  });

  it('uses default message when body is empty', () => {
    const error = new RevenueCatError(500, { message: 'Internal Server Error' });

    expect(error.message).toBe('Internal Server Error');
  });

  it('preserves all error body properties', () => {
    const errorBody: RevenueCatApiError = {
      object: 'error',
      type: 'rate_limit_error',
      message: 'Rate limit exceeded',
      doc_url: 'https://errors.rev.cat/rate-limit-error',
      retryable: true,
      backoff_ms: 1000,
      referenced_object_ids: ['prod_123'],
    };

    const error = new RevenueCatError(429, errorBody);

    expect(error.body.type).toBe('rate_limit_error');
    expect(error.body.retryable).toBe(true);
    expect(error.body.backoff_ms).toBe(1000);
    expect(error.body.referenced_object_ids).toEqual(['prod_123']);
  });
});

describe('RevenueCatConfigError', () => {
  it('creates error with message', () => {
    const error = new RevenueCatConfigError('Missing API key');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RevenueCatConfigError);
    expect(error.name).toBe('RevenueCatConfigError');
    expect(error.message).toBe('Missing API key');
  });

  it('works with instanceof check', () => {
    const error = new RevenueCatConfigError('Config problem');

    expect(error instanceof Error).toBe(true);
    expect(error instanceof RevenueCatConfigError).toBe(true);
    expect(error instanceof RevenueCatError).toBe(false);
  });
});

describe('Error differentiation', () => {
  it('distinguishes API errors from config errors', () => {
    const apiError = new RevenueCatError(400, { message: 'Bad request' });
    const configError = new RevenueCatConfigError('Invalid configuration');

    expect(apiError instanceof RevenueCatError).toBe(true);
    expect(apiError instanceof RevenueCatConfigError).toBe(false);
    expect(configError instanceof RevenueCatConfigError).toBe(true);
    expect(configError instanceof RevenueCatError).toBe(false);
  });
});