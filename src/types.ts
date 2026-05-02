// ============================================================
// RevenueCat REST API v2 — Type definitions
// Derived from the RevenueCat OpenAPI 3.0 v2 spec
// ============================================================

// ── Common ───────────────────────────────────────────────────

export type Environment = "sandbox" | "production";

export type Store =
  | "app_store"
  | "mac_app_store"
  | "play_store"
  | "amazon"
  | "stripe"
  | "promotional"
  | "roku"
  | "paddle";

export type Ownership = "purchased" | "family_shared";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "expired"
  | "in_grace_period"
  | "in_billing_retry"
  | "paused"
  | "unknown"
  | "incomplete";

export type AutoRenewalStatus =
  | "will_renew"
  | "will_not_renew"
  | "will_change_product"
  | "will_pause"
  | "requires_price_increase_consent"
  | "has_already_renewed";

export type Duration = "P1W" | "P1M" | "P2M" | "P3M" | "P6M" | "P1Y";

export type ExtendReasonCode =
  | "undeclared"
  | "customer_satisfaction"
  | "other"
  | "service_issue_or_outage";

// ── Pagination ───────────────────────────────────────────────

export interface ListResponse<T> {
  object: "list";
  items: T[];
  next_page: string | null;
  url: string;
}

// ── Monetary ─────────────────────────────────────────────────

export interface MonetaryAmount {
  currency: string;
  gross: number;
  proceeds: number;
  tax: number;
  commission: number;
}

// ── Customer ─────────────────────────────────────────────────

export interface Customer {
  object: "customer";
  id: string;
  project_id: string;
  first_seen_at: number;
  last_seen_at: number | null;
  last_seen_app_version: string | null;
  last_seen_country: string | null;
  last_seen_platform: string | null;
  last_seen_platform_version: string | null;
  active_entitlements?: ListResponse<CustomerEntitlement> | null;
  experiment?: ExperimentEnrollment | null;
  attributes?: ListResponse<CustomerAttribute> | null;
}

export interface CustomerEntitlement {
  object: "customer.active_entitlement";
  entitlement_id: string;
  expires_at: number | null;
}

export interface CustomerAttribute {
  object: "customer.attribute";
  name: string;
  value: string | null;
  updated_at: number;
}

export interface CustomerAlias {
  object: "customer.alias";
  id: string;
  created_at: number;
}

export interface ExperimentEnrollment {
  object: string;
  id: string;
  variant_id: string;
  variant_type: string;
}

// ── Subscription ─────────────────────────────────────────────

export interface Subscription {
  object: "subscription";
  id: string;
  customer_id: string;
  original_customer_id: string;
  product_id: string | null;
  starts_at: number;
  current_period_starts_at: number;
  current_period_ends_at: number | null;
  ends_at: number | null;
  gives_access: boolean;
  pending_payment: boolean;
  auto_renewal_status: AutoRenewalStatus;
  status: SubscriptionStatus;
  total_revenue_in_usd: MonetaryAmount;
  presented_offering_id: string | null;
  entitlements: ListResponse<Entitlement>;
  environment: Environment;
  store: Store;
  store_subscription_identifier: string;
  ownership: Ownership;
  management_url: string | null;
  pending_changes?: unknown;
  country?: string;
}

// ── Purchase ─────────────────────────────────────────────────

export interface Purchase {
  object: string;
  id: string;
  customer_id: string;
  product_id: string;
  store: Store;
  environment: Environment;
  purchased_at: number;
  store_transaction_identifier: string;
  total_revenue_in_usd: MonetaryAmount;
}

// ── Entitlement ──────────────────────────────────────────────

export interface Entitlement {
  object: "entitlement";
  project_id: string;
  id: string;
  lookup_key: string;
  display_name: string;
  state: "active" | "inactive";
  created_at: number;
  products?: ListResponse<Product>;
}

// ── Product ──────────────────────────────────────────────────

export interface Product {
  object: string;
  id: string;
  project_id: string;
  store_identifier: string;
  type: string;
  display_name: string;
  entitlement_ids?: string[];
  subscription_duration?: Duration | null;
}

// ── Offering ─────────────────────────────────────────────────

export interface Offering {
  object: "offering";
  id: string;
  project_id: string;
  lookup_key: string;
  display_name: string;
  description?: string;
  state: "active" | "inactive";
  created_at: number;
  packages: ListResponse<Package>;
}

// ── Package ──────────────────────────────────────────────────

export interface Package {
  object: string;
  id: string;
  project_id: string;
  display_name: string;
  position: number;
  products: ListResponse<Product>;
}

// ── Invoice ──────────────────────────────────────────────────

export interface Invoice {
  object: "invoice";
  id: string;
  total_amount: MonetaryAmount;
  line_items: InvoiceLineItem[];
  issued_at: number;
  paid_at: number | null;
  invoice_url: string | null;
}

export interface InvoiceLineItem {
  object: "invoice.line_item";
  product_identifier: string;
  product_display_name: string | null;
  product_duration: string | null;
  quantity: number;
  unit_amount: MonetaryAmount;
}

// ── Project ──────────────────────────────────────────────────

export interface Project {
  object: string;
  id: string;
  name: string;
  created_at: number;
}

// ── App ──────────────────────────────────────────────────────

export interface App {
  object: string;
  id: string;
  project_id: string;
  name: string;
  type: string;
  store?: string;
  bundle_id?: string;
}

// ── Deleted Object ───────────────────────────────────────────

export interface DeletedObject {
  object: string;
  id: string;
  deleted_at: number;
}

// ── Error ────────────────────────────────────────────────────

export interface RevenueCatApiError {
  object?: string;
  type?: string;
  message: string;
  doc_url?: string;
  retryable?: boolean;
  referenced_object_ids?: string[];
}

// ── Request types ────────────────────────────────────────────

export interface CreateCustomerRequest {
  id: string;
  attributes?: Array<{
    name: string;
    value: string;
  }>;
}

export interface GrantEntitlementRequest {
  entitlement_id: string;
  expires_at: number;
}

export interface RevokeEntitlementRequest {
  entitlement_id: string;
}

export interface SetCustomerAttributesRequest {
  attributes: Array<{
    name: string;
    value: string | null;
  }>;
}

export interface TransferCustomerRequest {
  target_customer_id: string;
  app_ids?: string[];
}

export interface AssignOfferingRequest {
  offering_id: string | null;
}

export interface ExtendSubscriptionByDurationRequest {
  extend_by_days: number;
  extend_reason_code?: ExtendReasonCode;
}

export interface ExtendSubscriptionUntilDateRequest {
  extend_until_ms: number;
  extend_reason_code?: ExtendReasonCode;
}

export interface CreateVirtualCurrencyTransactionRequest {
  adjustments: Record<string, number>;
  reference?: string | null;
}

export interface PaginationParams {
  starting_after?: string;
  limit?: number;
}

export interface ListCustomerSubscriptionsParams extends PaginationParams {
  environment?: Environment;
}

export interface ListCustomerPurchasesParams extends PaginationParams {
  environment?: Environment;
}

// ── Request types (missing from spec coverage) ──────────────

export interface RestorePurchaseByOrderIdRequest {
  order_id: string;
}

export interface UpdateVirtualCurrencyBalanceRequest {
  adjustments: Record<string, number>;
  reference?: string | null;
}

export interface CreateEntitlementRequest {
  lookup_key: string;
  display_name: string;
}

export interface UpdateEntitlementRequest {
  display_name: string;
}

export interface AttachProductsToEntitlementRequest {
  product_ids: string[];
}

export interface DetachProductsFromEntitlementRequest {
  product_ids: string[];
}

export interface CreateOfferingRequest {
  lookup_key: string;
  display_name: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOfferingRequest {
  display_name?: string;
  is_current?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreatePackageRequest {
  lookup_key: string;
  display_name: string;
  position?: number;
}

export interface UpdatePackageRequest {
  display_name?: string;
  position?: number;
}

export interface AttachProductsToPackageRequest {
  products: Array<{
    product_id: string;
    eligibility_criteria?: "all" | "google_sdk_lt_6" | "google_sdk_ge_6";
  }>;
}

export interface DetachProductsFromPackageRequest {
  product_ids: string[];
}

export interface CreatePaywallRequest {
  offering_id: string;
}

export interface CreateProductRequest {
  store_identifier: string;
  app_id: string;
  type: "subscription" | "one_time" | "consumable" | "non_consumable" | "non_renewing_subscription";
  display_name?: string;
  subscription?: {
    duration: Duration;
  };
  title?: string;
}

export interface UpdateProductRequest {
  display_name?: string;
}

export interface CreateVirtualCurrencyRequest {
  code: string;
  name: string;
  description?: string;
  product_grants?: Array<{
    product_ids: string[];
    amount: number;
    trial_amount?: number;
    expire_at_cycle_end?: boolean;
  }>;
}

export interface UpdateVirtualCurrencyRequest {
  name?: string;
  description?: string;
  product_grants?: Array<{
    product_ids: string[];
    amount: number;
    trial_amount?: number;
    expire_at_cycle_end?: boolean;
  }>;
}

export interface CreateWebhookIntegrationRequest {
  name: string;
  url: string;
  authorization_header?: string;
  environment?: "production" | "sandbox";
  event_types?: string[];
  app_id?: string;
}

export interface UpdateWebhookIntegrationRequest {
  name?: string;
  url?: string;
  authorization_header?: string | null;
  environment?: "production" | "sandbox" | null;
  event_types?: string[] | null;
  app_id?: string | null;
}

// ── Response types (missing) ─────────────────────────────────

export interface Transfer {
  object: "transfer";
  source_customer: Customer;
  target_customer: Customer;
}

export interface AuthenticatedManagementUrl {
  object: "authenticated_management_url";
  management_url: string | null;
}

export interface OverviewMetrics {
  object: "overview_metrics";
  metrics: OverviewMetric[];
}

export interface OverviewMetric {
  object: "overview_metric";
  id: string;
  name: string;
  description: string;
  unit: string;
  period: string;
  value: number;
  last_updated_at: number | null;
  last_updated_at_iso8601: string | null;
}

export interface ChartData {
  object: "chart_data";
  category: string;
  display_type: string;
  display_name: string;
  description: string;
  documentation_link?: string;
  last_computed_at?: number;
  start_date?: number;
  end_date?: number;
  yaxis_currency?: string;
  filtering_allowed: boolean;
  segmenting_allowed: boolean;
  resolution: string;
  values: unknown[];
  summary?: Record<string, unknown>;
  yaxis: string;
  segments?: Array<{ id: string; display_name: string }>;
  segments_limit?: number;
  measures?: unknown[];
  user_selectors?: Record<string, string>;
  unsupported_params?: {
    filters?: string[];
    segment?: string | null;
  };
}

export interface ChartOptions {
  object: "chart_options";
  resolutions: Array<{ id: string; display_name: string }>;
  segments: Array<{ id: string; display_name: string; group_display_name?: string }>;
  filters: Array<{
    id: string;
    display_name: string;
    group_display_name?: string;
    options: Array<{ id: string; display_name: string }>;
  }>;
  user_selectors?: Record<string, {
    default?: string;
    display_name?: string;
    options?: Array<{ id: string; display_name: string }>;
  }>;
}

export interface WebhookIntegration {
  object: "webhook_integration";
  id: string;
  project_id: string;
  name: string;
  url: string;
  environment: "production" | "sandbox" | null;
  event_types: string[] | null;
  app_id: string | null;
  created_at: number;
}

export interface Collaborator {
  object: "collaborator";
  id: string;
  name: string | null;
  email: string;
  role: string;
  accepted_at: number | null;
  has_mfa: boolean;
}

export interface AuditLog {
  object: "audit_log";
  id: string;
  project_id: string;
  action_type: string;
  target_type: string;
  target_identifier: string;
  actor_type: "user" | "system" | "api_key" | "oauth_client";
  actor_identifier: string;
  occurred_at: number;
  additional_data?: Record<string, unknown>;
}

export interface PublicApiKey {
  object: "public_api_key";
  id: string;
  key: string;
  environment: "production" | "sandbox";
  app_id: string;
  created_at: number;
}

export interface StoreKitConfigFile {
  object: "store_kit_config_file";
  contents: Record<string, unknown>;
}

export interface SubscriptionTransaction {
  object: "subscription_transaction";
  id: string;
  purchased_at: number;
  product_store_identifier: string;
  revenue_in_local_currency?: MonetaryAmount;
  revenue_in_usd?: MonetaryAmount;
  expiration_date?: number;
  effective_expiration_date?: number;
}

export interface ListSubscriptionsParams extends PaginationParams {
  store_subscription_identifier?: string;
}

export interface ListPurchasesParams extends PaginationParams {
  store_purchase_identifier?: string;
}

export interface GetChartDataParams {
  realtime?: boolean;
  filters?: string;
  selectors?: string;
  aggregate?: string[];
  currency?: string;
  resolution?: string;
  start_date?: string;
  end_date?: string;
  segment?: string;
  limit_num_segments?: number;
}
