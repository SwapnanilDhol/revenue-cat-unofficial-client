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
