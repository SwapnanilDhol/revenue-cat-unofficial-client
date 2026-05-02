// ============================================================
// RevenueCat Client — Custom error classes
// ============================================================

import type { RevenueCatApiError } from "./types";

export class RevenueCatError extends Error {
  public readonly statusCode: number;
  public readonly body: RevenueCatApiError;

  constructor(statusCode: number, body: RevenueCatApiError) {
    const message = body?.message ?? `RevenueCat API error (${statusCode})`;
    super(message);
    this.name = "RevenueCatError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

export class RevenueCatConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RevenueCatConfigError";
  }
}
