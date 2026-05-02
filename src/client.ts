// ============================================================
// RevenueCat REST API v1 — Type-safe client
// ============================================================

import type {
  Platform,
  CustomerInfoResponse,
  OfferingsResponse,
  CreatePurchaseRequest,
  GrantEntitlementRequest,
  UpdateAttributesRequest,
  AddAttributionRequest,
  DeferSubscriptionRequest,
  ExtendAppleSubscriptionRequest,
  DeleteCustomerResponse,
  RevenueCatApiError,
} from "./types";
import { RevenueCatError, RevenueCatConfigError } from "./errors";

const BASE_URL = "https://api.revenuecat.com/v1";

export interface RevenueCatClientOptions {
  /** Secret (or public) API key from the RevenueCat dashboard. */
  apiKey: string;
  /**
   * Optional base URL override. Useful for testing against a mock server.
   * @default "https://api.revenuecat.com/v1"
   */
  baseUrl?: string;
}

type RequestOptions = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export class RevenueCatClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: RevenueCatClientOptions) {
    if (!options.apiKey) {
      throw new RevenueCatConfigError(
        "RevenueCat API key is required. Set REVENUECAT_API_KEY in your environment."
      );
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? BASE_URL;
  }

  // ── Convenience factory ───────────────────────────────────

  /**
   * Create a client from the REVENUECAT_API_KEY environment variable.
   */
  static fromEnv(baseUrl?: string): RevenueCatClient {
    const apiKey = process.env.REVENUECAT_API_KEY;
    if (!apiKey) {
      throw new RevenueCatConfigError(
        "REVENUECAT_API_KEY environment variable is not set."
      );
    }
    return new RevenueCatClient({ apiKey, baseUrl });
  }

  // ── Customers ─────────────────────────────────────────────

  /**
   * GET /subscribers/{app_user_id}
   * Get or create a customer.
   */
  async getCustomer(
    appUserId: string,
    options?: { platform?: Platform }
  ): Promise<CustomerInfoResponse> {
    const headers: Record<string, string> = {};
    if (options?.platform) {
      headers["X-Platform"] = options.platform;
    }
    return this.request({
      method: "GET",
      path: `/subscribers/${encodeURIComponent(appUserId)}`,
      headers,
    });
  }

  /**
   * DELETE /subscribers/{app_user_id}
   * Permanently delete a customer.
   */
  async deleteCustomer(
    appUserId: string
  ): Promise<DeleteCustomerResponse> {
    return this.request({
      method: "DELETE",
      path: `/subscribers/${encodeURIComponent(appUserId)}`,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/attributes
   * Update customer attributes.
   */
  async updateAttributes(
    appUserId: string,
    params: UpdateAttributesRequest
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/attributes`,
      body: params,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/attribution
   * Add attribution data (deprecated by RevenueCat).
   * @deprecated
   */
  async addAttribution(
    appUserId: string,
    params: AddAttributionRequest
  ): Promise<Record<string, never>> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/attribution`,
      body: params,
    });
  }

  // ── Transactions ──────────────────────────────────────────

  /**
   * POST /receipts
   * Record a purchase for a customer.
   */
  async createPurchase(
    params: CreatePurchaseRequest,
    platform: Platform
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: "/receipts",
      body: params,
      headers: { "X-Platform": platform },
    });
  }

  /**
   * POST /subscribers/{app_user_id}/subscriptions/{product_identifier}/revoke
   * Google Play: Refund and revoke a subscription.
   */
  async revokeGoogleSubscription(
    appUserId: string,
    productIdentifier: string
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/subscriptions/${encodeURIComponent(productIdentifier)}/revoke`,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/transactions/{store_transaction_identifier}/refund
   * Google Play: Refund and revoke a purchase (subscription or non-subscription).
   */
  async refundGooglePurchase(
    appUserId: string,
    storeTransactionIdentifier: string
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/transactions/${encodeURIComponent(storeTransactionIdentifier)}/refund`,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/subscriptions/{store_transaction_identifier}/cancel
   * Google Play: Cancel a subscription (remains valid until expiry).
   */
  async cancelGoogleSubscription(
    appUserId: string,
    storeTransactionIdentifier: string
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/subscriptions/${encodeURIComponent(storeTransactionIdentifier)}/cancel`,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/subscriptions/{product_identifier}/defer
   * Google Play: Defer a subscription to a later date.
   */
  async deferGoogleSubscription(
    appUserId: string,
    productIdentifier: string,
    params: DeferSubscriptionRequest
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/subscriptions/${encodeURIComponent(productIdentifier)}/defer`,
      body: params,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/subscriptions/{store_transaction_identifier}/extend
   * App Store: Extend a subscription renewal date (up to 90 days).
   */
  async extendAppleSubscription(
    appUserId: string,
    storeTransactionIdentifier: string,
    params: ExtendAppleSubscriptionRequest
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/subscriptions/${encodeURIComponent(storeTransactionIdentifier)}/extend`,
      body: params,
    });
  }

  // ── Entitlements ──────────────────────────────────────────

  /**
   * POST /subscribers/{app_user_id}/entitlements/{entitlement_identifier}/promotional
   * Grant a promotional entitlement.
   */
  async grantEntitlement(
    appUserId: string,
    entitlementIdentifier: string,
    params: GrantEntitlementRequest
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementIdentifier)}/promotional`,
      body: params,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/entitlements/{entitlement_identifier}/revoke_promotionals
   * Revoke all promotional entitlements for an entitlement identifier.
   */
  async revokePromotionalEntitlements(
    appUserId: string,
    entitlementIdentifier: string
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementIdentifier)}/revoke_promotionals`,
    });
  }

  // ── Offerings ─────────────────────────────────────────────

  /**
   * GET /subscribers/{app_user_id}/offerings
   * Get offerings for the app.
   */
  async getOfferings(
    appUserId: string,
    options?: { platform?: Platform }
  ): Promise<OfferingsResponse> {
    const headers: Record<string, string> = {};
    if (options?.platform) {
      headers["X-Platform"] = options.platform;
    }
    return this.request({
      method: "GET",
      path: `/subscribers/${encodeURIComponent(appUserId)}/offerings`,
      headers,
    });
  }

  /**
   * POST /subscribers/{app_user_id}/offerings/{offering_uuid}/override
   * Override the current offering for a specific customer.
   */
  async overrideOffering(
    appUserId: string,
    offeringUuid: string
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "POST",
      path: `/subscribers/${encodeURIComponent(appUserId)}/offerings/${encodeURIComponent(offeringUuid)}/override`,
    });
  }

  /**
   * DELETE /subscribers/{app_user_id}/offerings/override
   * Remove a customer's offering override.
   */
  async removeOfferingOverride(
    appUserId: string
  ): Promise<CustomerInfoResponse> {
    return this.request({
      method: "DELETE",
      path: `/subscribers/${encodeURIComponent(appUserId)}/offerings/override`,
    });
  }

  // ── Convenience helpers ───────────────────────────────────

  /**
   * Check if a user has an active entitlement (e.g. "pro").
   * Handles subscriptions, trials, lifetime purchases, and family sharing.
   */
  async hasActiveEntitlement(
    appUserId: string,
    entitlementIdentifier: string
  ): Promise<boolean> {
    const customer = await this.getCustomer(appUserId);
    const entitlement = customer.subscriber.entitlements[entitlementIdentifier];
    if (!entitlement) return false;

    const periodType = entitlement.period_type;
    const expiresDate = entitlement.expires_date;

    // Non-subscription / missing period type → lifetime purchase
    if (!periodType || periodType === undefined) return true;

    // No expiration → lifetime / active
    if (!expiresDate) return true;

    return new Date(expiresDate) > new Date();
  }

  /**
   * Check if a user is a "Pro" user by verifying any active entitlement.
   * Returns true if ANY entitlement is currently active.
   */
  async isProUser(appUserId: string): Promise<boolean> {
    const customer = await this.getCustomer(appUserId);
    const entitlements = customer.subscriber.entitlements;

    return Object.values(entitlements).some((ent) => {
      if (!ent?.product_identifier) return false;

      const expiresDate = ent.expires_date;
      if (!expiresDate) return true; // Lifetime or no expiration
      return new Date(expiresDate) > new Date();
    });
  }

  // ── Internal HTTP layer ───────────────────────────────────

  private async request<T>(opts: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${opts.path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...opts.headers,
    };

    const fetchOptions: RequestInit = {
      method: opts.method,
      headers,
    };

    if (opts.body !== undefined) {
      fetchOptions.body = JSON.stringify(opts.body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorBody: RevenueCatApiError = {
        message: response.statusText,
      };
      try {
        errorBody = (await response.json()) as RevenueCatApiError;
      } catch {
        // If we can't parse the error body, use the status text
      }
      throw new RevenueCatError(response.status, errorBody);
    }

    // Some endpoints return empty objects (e.g. attribution)
    const text = await response.text();
    if (!text || text.trim() === "") {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }
}
