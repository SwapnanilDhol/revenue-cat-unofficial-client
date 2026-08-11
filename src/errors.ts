// ============================================================
// RevenueCat Client — Custom error classes
// ============================================================

import type { RevenueCatApiError } from "./types";

export class RevenueCatError extends Error {
  public readonly statusCode: number;
  public readonly body: RevenueCatApiError;
  public readonly retryAfterMs?: number;

  constructor(statusCode: number, body: RevenueCatApiError, retryAfterMs?: number) {
    const message = body?.message ?? `RevenueCat API error (${statusCode})`;
    super(message);
    this.name = "RevenueCatError";
    this.statusCode = statusCode;
    this.body = body;
    this.retryAfterMs = retryAfterMs;
  }
}

export class RevenueCatTransportError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RevenueCatTransportError";
  }
}

export class RevenueCatResponseTooLargeError extends RevenueCatTransportError {
  public readonly maximumBytes: number;

  constructor(maximumBytes: number) {
    super(`RevenueCat response exceeded the ${maximumBytes}-byte safety limit.`);
    this.name = "RevenueCatResponseTooLargeError";
    this.maximumBytes = maximumBytes;
  }
}

export class RevenueCatConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RevenueCatConfigError";
  }
}
