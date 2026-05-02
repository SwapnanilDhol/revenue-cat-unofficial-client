// ============================================================
// RevenueCat REST API v2 — Type-safe client
// ============================================================

import type {
  Customer,
  CustomerAlias,
  CustomerAttribute,
  CustomerEntitlement,
  DeletedObject,
  Entitlement,
  ListResponse,
  Offering,
  Package,
  Product,
  Project,
  Purchase,
  Subscription,
  Invoice,
  App,
  RevenueCatApiError,
  CreateCustomerRequest,
  GrantEntitlementRequest,
  RevokeEntitlementRequest,
  SetCustomerAttributesRequest,
  TransferCustomerRequest,
  AssignOfferingRequest,
  ExtendSubscriptionByDurationRequest,
  ExtendSubscriptionUntilDateRequest,
  CreateVirtualCurrencyTransactionRequest,
  PaginationParams,
  ListCustomerSubscriptionsParams,
  ListCustomerPurchasesParams,
} from "./types";
import { RevenueCatError, RevenueCatConfigError } from "./errors";

const BASE_URL = "https://api.revenuecat.com/v2";

export interface RevenueCatClientOptions {
  /** V2 Secret (or public) API key from the RevenueCat dashboard. */
  apiKey: string;
  /** RevenueCat project ID (required for most v2 endpoints). */
  projectId: string;
  /**
   * Optional base URL override. Useful for testing against a mock server.
   * @default "https://api.revenuecat.com/v2"
   */
  baseUrl?: string;
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
};

export class RevenueCatClient {
  private readonly apiKey: string;
  private readonly projectId: string;
  private readonly baseUrl: string;

  constructor(options: RevenueCatClientOptions) {
    if (!options.apiKey) {
      throw new RevenueCatConfigError(
        "RevenueCat API key is required. Set REVENUECAT_API_KEY in your environment."
      );
    }
    if (!options.projectId) {
      throw new RevenueCatConfigError(
        "RevenueCat project ID is required. Set REVENUECAT_PROJECT_ID in your environment."
      );
    }
    this.apiKey = options.apiKey;
    this.projectId = options.projectId;
    this.baseUrl = options.baseUrl ?? BASE_URL;
  }

  // ── Convenience factory ───────────────────────────────────

  static fromEnv(baseUrl?: string): RevenueCatClient {
    const apiKey = process.env.REVENUECAT_API_KEY;
    const projectId = process.env.REVENUECAT_PROJECT_ID;
    if (!apiKey) {
      throw new RevenueCatConfigError(
        "REVENUECAT_API_KEY environment variable is not set."
      );
    }
    if (!projectId) {
      throw new RevenueCatConfigError(
        "REVENUECAT_PROJECT_ID environment variable is not set."
      );
    }
    return new RevenueCatClient({ apiKey, projectId, baseUrl });
  }

  private get pId(): string {
    return this.projectId;
  }

  // ── Projects ──────────────────────────────────────────────

  async listProjects(params?: PaginationParams): Promise<ListResponse<Project>> {
    return this.request({ method: "GET", path: "/projects", query: toQuery(params) });
  }

  async getProject(projectId?: string): Promise<Project> {
    return this.request({ method: "GET", path: `/projects/${projectId ?? this.pId}` });
  }

  // ── Apps ──────────────────────────────────────────────────

  async listApps(projectId?: string, params?: PaginationParams): Promise<ListResponse<App>> {
    return this.request({ method: "GET", path: `/projects/${projectId ?? this.pId}/apps`, query: toQuery(params) });
  }

  // ── Customers ─────────────────────────────────────────────

  async listCustomers(params?: PaginationParams & { search?: string }): Promise<ListResponse<Customer>> {
    return this.request({ method: "GET", path: `/projects/${this.pId}/customers`, query: toQuery(params) });
  }

  async getCustomer(
    customerId: string,
    options?: { expand?: ("attributes")[] }
  ): Promise<Customer> {
    const query: Record<string, string | string[] | undefined> = {};
    if (options?.expand?.length) {
      query.expand = options.expand;
    }
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}`,
      query: Object.keys(query).length ? query : undefined,
    });
  }

  async createCustomer(params: CreateCustomerRequest): Promise<Customer> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/customers`,
      body: params,
    });
  }

  async deleteCustomer(customerId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}`,
    });
  }

  async transferCustomer(
    customerId: string,
    params: TransferCustomerRequest
  ): Promise<void> {
    return this.requestEmpty({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/actions/transfer`,
      body: params,
    });
  }

  async grantEntitlement(
    customerId: string,
    params: GrantEntitlementRequest
  ): Promise<Customer> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/actions/grant_entitlement`,
      body: params,
    });
  }

  async revokeEntitlement(
    customerId: string,
    params: RevokeEntitlementRequest
  ): Promise<Customer> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/actions/revoke_granted_entitlement`,
      body: params,
    });
  }

  async assignOffering(
    customerId: string,
    params: AssignOfferingRequest
  ): Promise<void> {
    return this.requestEmpty({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/actions/assign_offering`,
      body: params,
    });
  }

  // ── Customer Attributes ───────────────────────────────────

  async getCustomerAttributes(
    customerId: string,
    params?: PaginationParams
  ): Promise<ListResponse<CustomerAttribute>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/attributes`,
      query: toQuery(params),
    });
  }

  async setCustomerAttributes(
    customerId: string,
    params: SetCustomerAttributesRequest
  ): Promise<ListResponse<CustomerAttribute>> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/attributes`,
      body: params,
    });
  }

  // ── Customer Active Entitlements ──────────────────────────

  async getCustomerActiveEntitlements(
    customerId: string,
    params?: PaginationParams
  ): Promise<ListResponse<CustomerEntitlement>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/active_entitlements`,
      query: toQuery(params),
    });
  }

  // ── Customer Aliases ──────────────────────────────────────

  async getCustomerAliases(
    customerId: string,
    params?: PaginationParams
  ): Promise<ListResponse<CustomerAlias>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/aliases`,
      query: toQuery(params),
    });
  }

  // ── Customer Subscriptions ────────────────────────────────

  async getCustomerSubscriptions(
    customerId: string,
    params?: ListCustomerSubscriptionsParams
  ): Promise<ListResponse<Subscription>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/subscriptions`,
      query: toQuery(params),
    });
  }

  // ── Customer Purchases ────────────────────────────────────

  async getCustomerPurchases(
    customerId: string,
    params?: ListCustomerPurchasesParams
  ): Promise<ListResponse<Purchase>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/purchases`,
      query: toQuery(params),
    });
  }

  // ── Customer Invoices ─────────────────────────────────────

  async getCustomerInvoices(
    customerId: string,
    params?: PaginationParams
  ): Promise<ListResponse<Invoice>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/invoices`,
      query: toQuery(params),
    });
  }

  async getCustomerInvoiceFile(
    customerId: string,
    invoiceId: string
  ): Promise<Blob> {
    const url = `${this.baseUrl}/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/invoices/${encodeURIComponent(invoiceId)}/file`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!response.ok) {
      let errorBody: RevenueCatApiError = { message: response.statusText };
      try { errorBody = (await response.json()) as RevenueCatApiError; } catch { /* ignore */ }
      throw new RevenueCatError(response.status, errorBody);
    }
    return response.blob() as Promise<Blob>;
  }

  // ── Customer Virtual Currencies ───────────────────────────

  async getCustomerVirtualCurrencies(
    customerId: string,
    params?: PaginationParams & { include_empty_balances?: boolean }
  ): Promise<ListResponse<unknown>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/virtual_currencies`,
      query: toQuery(params),
    });
  }

  async createVirtualCurrencyTransaction(
    customerId: string,
    params: CreateVirtualCurrencyTransactionRequest,
    idempotencyKey?: string
  ): Promise<ListResponse<unknown>> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/virtual_currencies/transactions`,
      body: params,
      headers,
    });
  }

  // ── Subscriptions ─────────────────────────────────────────

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}`,
    });
  }

  async getSubscriptionTransactions(
    subscriptionId: string,
    params?: PaginationParams & { sort?: string; direction?: string }
  ): Promise<ListResponse<unknown>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/transactions`,
      query: toQuery(params),
    });
  }

  async getSubscriptionEntitlements(
    subscriptionId: string,
    params?: PaginationParams
  ): Promise<ListResponse<Entitlement>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/entitlements`,
      query: toQuery(params),
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/actions/cancel`,
    });
  }

  async extendSubscriptionByDuration(
    subscriptionId: string,
    params: ExtendSubscriptionByDurationRequest
  ): Promise<Subscription> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/actions/extend`,
      body: { extend_by_days: params.extend_by_days, extend_reason_code: params.extend_reason_code },
    });
  }

  async extendSubscriptionUntilDate(
    subscriptionId: string,
    params: ExtendSubscriptionUntilDateRequest
  ): Promise<Subscription> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/actions/extend`,
      body: { extend_until_ms: params.extend_until_ms, extend_reason_code: params.extend_reason_code },
    });
  }

  async refundSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/actions/refund`,
    });
  }

  async refundSubscriptionTransaction(
    subscriptionId: string,
    transactionId: string
  ): Promise<Subscription> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/transactions/${encodeURIComponent(transactionId)}/actions/refund`,
    });
  }

  async getSubscriptionAuthenticatedManagementUrl(
    subscriptionId: string
  ): Promise<{ url: string }> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/subscriptions/${encodeURIComponent(subscriptionId)}/authenticated_management_url`,
    });
  }

  // ── Purchases ─────────────────────────────────────────────

  async getPurchase(purchaseId: string): Promise<Purchase> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/purchases/${encodeURIComponent(purchaseId)}`,
    });
  }

  async getPurchaseEntitlements(
    purchaseId: string,
    params?: PaginationParams
  ): Promise<ListResponse<Entitlement>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/purchases/${encodeURIComponent(purchaseId)}/entitlements`,
      query: toQuery(params),
    });
  }

  async refundPurchase(purchaseId: string): Promise<Purchase> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/purchases/${encodeURIComponent(purchaseId)}/actions/refund`,
    });
  }

  async restorePurchaseByOrderId(
    customerId: string,
    params: { order_id: string }
  ): Promise<Customer> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/actions/restore_purchase_by_order_id`,
      body: params,
    });
  }

  // ── Entitlements ──────────────────────────────────────────

  async listEntitlements(params?: PaginationParams): Promise<ListResponse<Entitlement>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/entitlements`,
      query: toQuery(params),
    });
  }

  async getEntitlement(entitlementId: string): Promise<Entitlement> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/entitlements/${encodeURIComponent(entitlementId)}`,
    });
  }

  async createEntitlement(params: {
    lookup_key: string;
    display_name: string;
  }): Promise<Entitlement> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/entitlements`,
      body: params,
    });
  }

  async updateEntitlement(
    entitlementId: string,
    params: { display_name: string }
  ): Promise<Entitlement> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/entitlements/${encodeURIComponent(entitlementId)}`,
      body: params,
    });
  }

  async deleteEntitlement(entitlementId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/entitlements/${encodeURIComponent(entitlementId)}`,
    });
  }

  async archiveEntitlement(entitlementId: string): Promise<Entitlement> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/entitlements/${encodeURIComponent(entitlementId)}/actions/archive`,
    });
  }

  async unarchiveEntitlement(entitlementId: string): Promise<Entitlement> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/entitlements/${encodeURIComponent(entitlementId)}/actions/unarchive`,
    });
  }

  async attachProductsToEntitlement(
    entitlementId: string,
    params: { product_ids: string[] }
  ): Promise<Entitlement> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/entitlements/${encodeURIComponent(entitlementId)}/actions/attach_products`,
      body: params,
    });
  }

  async detachProductsFromEntitlement(
    entitlementId: string,
    params: { product_ids: string[] }
  ): Promise<Entitlement> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/entitlements/${encodeURIComponent(entitlementId)}/actions/detach_products`,
      body: params,
    });
  }

  // ── Products ──────────────────────────────────────────────

  async listProducts(params?: PaginationParams & { app_id?: string }): Promise<ListResponse<Product>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/products`,
      query: toQuery(params),
    });
  }

  async getProduct(productId: string): Promise<Product> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/products/${encodeURIComponent(productId)}`,
    });
  }

  async updateProduct(
    productId: string,
    params: { display_name?: string }
  ): Promise<Product> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/products/${encodeURIComponent(productId)}`,
      body: params,
    });
  }

  async deleteProduct(productId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/products/${encodeURIComponent(productId)}`,
    });
  }

  async archiveProduct(productId: string): Promise<Product> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/products/${encodeURIComponent(productId)}/actions/archive`,
    });
  }

  async unarchiveProduct(productId: string): Promise<Product> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/products/${encodeURIComponent(productId)}/actions/unarchive`,
    });
  }

  // ── Offerings ─────────────────────────────────────────────

  async listOfferings(params?: PaginationParams): Promise<ListResponse<Offering>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/offerings`,
      query: toQuery(params),
    });
  }

  async getOffering(offeringId: string): Promise<Offering> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/offerings/${encodeURIComponent(offeringId)}`,
    });
  }

  async createOffering(params: {
    lookup_key: string;
    display_name: string;
    metadata?: Record<string, unknown>;
  }): Promise<Offering> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/offerings`,
      body: params,
    });
  }

  async updateOffering(
    offeringId: string,
    params: {
      display_name?: string;
      is_current?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Offering> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/offerings/${encodeURIComponent(offeringId)}`,
      body: params,
    });
  }

  async deleteOffering(offeringId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/offerings/${encodeURIComponent(offeringId)}`,
    });
  }

  async archiveOffering(offeringId: string): Promise<Offering> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/offerings/${encodeURIComponent(offeringId)}/actions/archive`,
    });
  }

  async unarchiveOffering(
    offeringId: string,
    params?: { unarchive_referenced_entities?: boolean }
  ): Promise<Offering> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/offerings/${encodeURIComponent(offeringId)}/actions/unarchive`,
      body: params,
    });
  }

  // ── Packages ──────────────────────────────────────────────

  async listPackages(
    offeringId: string,
    params?: PaginationParams
  ): Promise<ListResponse<Package>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/offerings/${encodeURIComponent(offeringId)}/packages`,
      query: toQuery(params),
    });
  }

  async getPackage(packageId: string): Promise<Package> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/packages/${encodeURIComponent(packageId)}`,
    });
  }

  async createPackage(
    offeringId: string,
    params: {
      lookup_key: string;
      display_name: string;
      position?: number;
    }
  ): Promise<Package> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/offerings/${encodeURIComponent(offeringId)}/packages`,
      body: params,
    });
  }

  async updatePackage(
    packageId: string,
    params: {
      display_name?: string;
      position?: number;
    }
  ): Promise<Package> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/packages/${encodeURIComponent(packageId)}`,
      body: params,
    });
  }

  async deletePackage(packageId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/packages/${encodeURIComponent(packageId)}`,
    });
  }

  async attachProductsToPackage(
    packageId: string,
    params: {
      products: Array<{
        product_id: string;
        eligibility_criteria?: "all" | "google_sdk_lt_6" | "google_sdk_ge_6";
      }>;
    }
  ): Promise<Package> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/packages/${encodeURIComponent(packageId)}/actions/attach_products`,
      body: params,
    });
  }

  async detachProductsFromPackage(
    packageId: string,
    params: { product_ids: string[] }
  ): Promise<Package> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/packages/${encodeURIComponent(packageId)}/actions/detach_products`,
      body: params,
    });
  }

  // ── Paywalls ──────────────────────────────────────────────

  async listPaywalls(params?: PaginationParams): Promise<ListResponse<unknown>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/paywalls`,
      query: toQuery(params),
    });
  }

  async getPaywall(paywallId: string): Promise<unknown> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/paywalls/${encodeURIComponent(paywallId)}`,
    });
  }

  async createPaywall(params: { offering_id: string }): Promise<unknown> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/paywalls`,
      body: params,
    });
  }

  async deletePaywall(paywallId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/paywalls/${encodeURIComponent(paywallId)}`,
    });
  }

  // ── Virtual Currencies ────────────────────────────────────

  async updateVirtualCurrencyBalance(
    customerId: string,
    params: { adjustments: Record<string, number>; reference?: string | null }
  ): Promise<unknown> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/customers/${encodeURIComponent(customerId)}/virtual_currencies/update_balance`,
      body: params,
    });
  }

  // ── Apps ──────────────────────────────────────────────────

  async getApp(appId: string): Promise<App> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/apps/${encodeURIComponent(appId)}`,
    });
  }

  async createApp(params: Record<string, unknown>): Promise<App> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/apps`,
      body: params,
    });
  }

  async updateApp(appId: string, params: Record<string, unknown>): Promise<App> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/apps/${encodeURIComponent(appId)}`,
      body: params,
    });
  }

  async deleteApp(appId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/apps/${encodeURIComponent(appId)}`,
    });
  }

  async getAppStoreKitConfig(appId: string): Promise<unknown> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/apps/${encodeURIComponent(appId)}/store_kit_config`,
    });
  }

  async listAppPublicApiKeys(appId: string): Promise<ListResponse<unknown>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/apps/${encodeURIComponent(appId)}/public_api_keys`,
    });
  }

  // ── Audit Logs ────────────────────────────────────────────

  async listAuditLogs(params?: {
    starting_after?: string;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ListResponse<unknown>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/audit_logs`,
      query: toQuery(params),
    });
  }

  // ── Collaborators ────────────────────────────────────────

  async listCollaborators(params?: PaginationParams): Promise<ListResponse<unknown>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/collaborators`,
      query: toQuery(params),
    });
  }

  // ── Webhook Integrations ─────────────────────────────────

  async listWebhookIntegrations(params?: PaginationParams): Promise<ListResponse<unknown>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/integrations/webhooks`,
      query: toQuery(params),
    });
  }

  async getWebhookIntegration(webhookId: string): Promise<unknown> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/integrations/webhooks/${encodeURIComponent(webhookId)}`,
    });
  }

  async createWebhookIntegration(params: Record<string, unknown>): Promise<unknown> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/integrations/webhooks`,
      body: params,
    });
  }

  async updateWebhookIntegration(
    webhookId: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    return this.request({
      method: "POST",
      path: `/projects/${this.pId}/integrations/webhooks/${encodeURIComponent(webhookId)}`,
      body: params,
    });
  }

  async deleteWebhookIntegration(webhookId: string): Promise<DeletedObject> {
    return this.request({
      method: "DELETE",
      path: `/projects/${this.pId}/integrations/webhooks/${encodeURIComponent(webhookId)}`,
    });
  }

  // ── Charts & Metrics ─────────────────────────────────────

  async getOverviewMetrics(params?: { currency?: string }): Promise<unknown> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/metrics/overview`,
      query: toQuery(params),
    });
  }

  async getChartData(
    chartName: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/charts/${encodeURIComponent(chartName)}`,
      query: toQuery(params),
    });
  }

  async getChartOptions(chartName: string, params?: { realtime?: boolean }): Promise<unknown> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/charts/${encodeURIComponent(chartName)}/options`,
      query: toQuery(params),
    });
  }

  // ── Search ───────────────────────────────────────────────

  async searchSubscriptions(
    storeSubscriptionIdentifier: string
  ): Promise<ListResponse<Subscription>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/subscriptions`,
      query: { store_subscription_identifier: storeSubscriptionIdentifier },
    });
  }

  async searchPurchases(
    storePurchaseIdentifier: string
  ): Promise<ListResponse<Purchase>> {
    return this.request({
      method: "GET",
      path: `/projects/${this.pId}/purchases`,
      query: { store_purchase_identifier: storePurchaseIdentifier },
    });
  }

  // ── Convenience helpers ───────────────────────────────────

  /**
   * Check if a customer has any active entitlements.
   */
  async hasActiveEntitlements(customerId: string): Promise<boolean> {
    const entitlements = await this.getCustomerActiveEntitlements(customerId);
    return entitlements.items.length > 0;
  }

  /**
   * Check if a customer has a specific active entitlement by entitlement_id.
   */
  async hasEntitlement(customerId: string, entitlementId: string): Promise<boolean> {
    const entitlements = await this.getCustomerActiveEntitlements(customerId);
    return entitlements.items.some((e) => e.entitlement_id === entitlementId);
  }

  /**
   * Check if a user is a "Pro" user by verifying they have active entitlements
   * OR active subscriptions that give access.
   */
  async isProUser(customerId: string): Promise<boolean> {
    // Check active entitlements first (fastest)
    const entitlements = await this.getCustomerActiveEntitlements(customerId);
    if (entitlements.items.length > 0) return true;

    // Fall back to checking subscriptions
    const subs = await this.getCustomerSubscriptions(customerId);
    return subs.items.some((sub) => sub.gives_access);
  }

  // ── Internal HTTP layer ───────────────────────────────────

  private async request<T>(opts: RequestOptions): Promise<T> {
    const url = this.buildUrl(opts);

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
      let errorBody: RevenueCatApiError = { message: response.statusText };
      try {
        errorBody = (await response.json()) as RevenueCatApiError;
      } catch {
        // use default
      }
      throw new RevenueCatError(response.status, errorBody);
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  /** For endpoints that return 200 with no body. */
  private async requestEmpty(opts: RequestOptions): Promise<void> {
    const url = this.buildUrl(opts);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...opts.headers,
    };
    const fetchOptions: RequestInit = { method: opts.method, headers };
    if (opts.body !== undefined) fetchOptions.body = JSON.stringify(opts.body);

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      let errorBody: RevenueCatApiError = { message: response.statusText };
      try { errorBody = (await response.json()) as RevenueCatApiError; } catch { /* ignore */ }
      throw new RevenueCatError(response.status, errorBody);
    }
  }

  private buildUrl(opts: RequestOptions): string {
    const url = new URL(`${this.baseUrl}${opts.path}`);
    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) url.searchParams.append(key, v);
        } else {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }
}

// ── Utility ─────────────────────────────────────────────────

function toQuery(
  params?: object | undefined
): Record<string, string | string[] | undefined> | undefined {
  if (!params) return undefined;
  const result: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      result[key] = value.map(String);
    } else {
      result[key] = String(value);
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
