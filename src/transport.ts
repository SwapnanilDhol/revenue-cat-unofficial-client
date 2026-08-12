import {
  RevenueCatError,
  RevenueCatResponseTooLargeError,
  RevenueCatTransportError,
} from "./errors";
import type { RevenueCatApiError } from "./types";

export interface RevenueCatTransportOptions {
  apiKey: string;
  baseUrl: string;
  fetch: typeof globalThis.fetch;
  timeoutMs: number;
  maxAttempts: number;
  maxRetryDelayMs: number;
  maxResponseBytes: number;
}

export interface RevenueCatRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
}

export class RevenueCatTransport {
  constructor(private readonly options: RevenueCatTransportOptions) {}

  async request<T>(request: RevenueCatRequest): Promise<T> {
    const response = await this.execute(request);
    const text = await readResponseText(response, this.options.maxResponseBytes);
    return !text.trim() ? {} as T : JSON.parse(text) as T;
  }

  async requestEmpty(request: RevenueCatRequest): Promise<void> {
    await this.execute(request);
  }

  async response(request: RevenueCatRequest): Promise<Response> {
    return this.execute(request);
  }

  private async execute(request: RevenueCatRequest): Promise<Response> {
    const url = request.path.startsWith("http")
      ? request.path
      : buildUrl(this.options.baseUrl, request);
    const headers = {
      Authorization: "Bearer " + this.options.apiKey,
      "Content-Type": "application/json",
      ...request.headers,
    };
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
      try {
        const response = await this.options.fetch(url, {
          method: request.method,
          headers,
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: controller.signal,
        });
        if (response.ok) return response;
        const error = await revenueCatError(response, this.options.maxResponseBytes);
        const retryDelay = error.retryAfterMs ?? retryDelayForAttempt(attempt);
        const canRetry = request.method === "GET"
          && attempt < this.options.maxAttempts
          && isRetryable(error)
          && retryDelay <= this.options.maxRetryDelayMs;
        if (!canRetry) throw error;
        await delay(retryDelay);
      } catch (error) {
        if (error instanceof RevenueCatError || error instanceof RevenueCatResponseTooLargeError) {
          throw error;
        }
        if (request.method === "GET" && attempt < this.options.maxAttempts) {
          await delay(retryDelayForAttempt(attempt));
          continue;
        }
        throw new RevenueCatTransportError("RevenueCat request failed.", { cause: error });
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new RevenueCatTransportError("RevenueCat request exhausted all attempts.");
  }
}

function buildUrl(baseUrl: string, request: RevenueCatRequest): string {
  const url = new URL(baseUrl + request.path);
  for (const [key, value] of Object.entries(request.query ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
    else url.searchParams.set(key, value);
  }
  return url.toString();
}

async function revenueCatError(response: Response, maximumBytes: number): Promise<RevenueCatError> {
  let body: RevenueCatApiError = { message: response.statusText };
  try {
    const text = await readResponseText(response, maximumBytes);
    if (text) body = JSON.parse(text) as RevenueCatApiError;
  } catch (error) {
    if (error instanceof RevenueCatResponseTooLargeError) throw error;
  }
  const retryAfterMs = parseRetryAfter(response.headers.get("Retry-After")) ?? body.backoff_ms;
  return new RevenueCatError(response.status, body, retryAfterMs);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1_000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

function isRetryable(error: RevenueCatError): boolean {
  return error.body.retryable === true || [423, 429, 500, 502, 503, 504].includes(error.statusCode);
}

function retryDelayForAttempt(attempt: number): number { return 250 * 2 ** (attempt - 1); }
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readResponseText(response: Response, maximumBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw new RevenueCatResponseTooLargeError(maximumBytes);
  }
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maximumBytes) {
      throw new RevenueCatResponseTooLargeError(maximumBytes);
    }
    return text;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel();
      throw new RevenueCatResponseTooLargeError(maximumBytes);
    }
    chunks.push(value);
  }
  const output = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(output);
}
