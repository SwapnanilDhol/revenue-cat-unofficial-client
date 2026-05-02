// ============================================================
// RevenueCat REST API v1 — Type definitions
// Derived from the RevenueCat OpenAPI 3.0 spec
// ============================================================

// ── Enums / Unions ────────────────────────────────────────────

export type Platform =
  | "ios"
  | "android"
  | "amazon"
  | "macos"
  | "uikitformac"
  | "stripe"
  | "roku"
  | "paddle";

export type Store =
  | "app_store"
  | "mac_app_store"
  | "play_store"
  | "amazon"
  | "stripe"
  | "promotional"
  | "roku"
  | "paddle";

export type OwnershipType = "PURCHASED" | "FAMILY_SHARED";

export type PeriodType = "normal" | "trial" | "intro";

export type AttributionNetwork = "0" | "1" | "2" | "3" | "4" | "5";

export type PromotionalDuration =
  | "daily"
  | "three_day"
  | "weekly"
  | "two_week"
  | "monthly"
  | "two_month"
  | "three_month"
  | "six_month"
  | "yearly"
  | "lifetime";

export type PaymentMode = 0 | 1 | 2;

export type ExtendReasonCode = 0 | 1 | 2 | 3;

// ── Customer Info model ──────────────────────────────────────

export interface EntitlementInfo {
  expires_date: string | null;
  grace_period_expires_date: string | null;
  product_identifier: string;
  purchase_date: string;
  /** v2 field */
  period_type?: PeriodType;
}

export interface Entitlements {
  [entitlementIdentifier: string]: EntitlementInfo;
}

export interface NonSubscriptionPurchase {
  display_name: string;
  id: string;
  is_sandbox: boolean;
  price?: {
    amount: number;
    currency: string;
  };
  purchase_date: string;
  store: Store;
  store_transaction_id: string;
}

export interface NonSubscriptions {
  [productIdentifier: string]: NonSubscriptionPurchase[];
}

export interface SubscriptionInfo {
  auto_resume_date: string | null;
  billing_issues_detected_at: string | null;
  expires_date: string;
  display_name?: string;
  grace_period_expires_date: string | null;
  is_sandbox: boolean;
  original_purchase_date: string;
  ownership_type: OwnershipType;
  period_type: PeriodType;
  price?: {
    amount: number;
    currency: string;
  };
  purchase_date: string;
  refunded_at: string | null;
  store: Store;
  store_transaction_id: string;
  unsubscribe_detected_at: string;
}

export interface Subscriptions {
  [productIdentifier: string]: SubscriptionInfo;
}

export interface SubscriberAttribute {
  value: string;
  updated_at_ms: number;
}

export interface SubscriberAttributes {
  [key: string]: SubscriberAttribute;
}

export interface Subscriber {
  entitlements: Entitlements;
  first_seen: string;
  last_seen: string;
  management_url: string | null;
  non_subscriptions: NonSubscriptions;
  original_app_user_id: string;
  original_application_version: string | null;
  original_purchase_date: string | null;
  /** @deprecated Use non_subscriptions instead */
  other_purchases?: Record<string, unknown>;
  subscriber_attributes?: SubscriberAttributes;
  subscriptions: Subscriptions;
}

export interface CustomerInfoResponse {
  request_date: string;
  request_date_ms: number;
  subscriber: Subscriber;
}

// ── Offerings model ──────────────────────────────────────────

export interface Package {
  identifier: string;
  platform_product_identifier: string;
}

export interface Offering {
  description: string;
  identifier: string;
  packages: Package[];
}

export interface OfferingsResponse {
  current_offering_id: string;
  offerings: Offering[];
}

// ── Error model ──────────────────────────────────────────────

export interface RevenueCatApiError {
  message: string;
  code?: number;
  attribute_errors?: Array<{
    key_name: string;
    message: string;
  }>;
}

// ── Request types ────────────────────────────────────────────

export interface CreatePurchaseRequest {
  app_user_id: string;
  fetch_token: string;
  product_id?: string;
  price?: number;
  currency?: string;
  payment_mode?: PaymentMode;
  introductory_price?: number;
  /** @deprecated */
  is_restore?: boolean;
  presented_offering_identifier?: string;
  attributes?: Record<
    string,
    {
      value: string;
      updated_at_ms?: number;
    }
  >;
}

export interface GrantEntitlementRequest {
  end_time_ms?: number;
  /** @deprecated Use end_time_ms instead */
  duration?: PromotionalDuration;
  /** @deprecated */
  start_time_ms?: number;
}

export interface UpdateAttributesRequest {
  attributes: Record<
    string,
    {
      value: string;
      updated_at_ms?: number;
    }
  >;
}

export interface AddAttributionRequest {
  data: {
    rc_idfa?: string;
    rc_gps_adid?: string;
  };
  network: AttributionNetwork;
}

export interface DeferSubscriptionRequest {
  expiry_time_ms?: number;
  extend_by_days?: number;
}

export interface ExtendAppleSubscriptionRequest {
  extend_by_days: number;
  extend_reason_code: ExtendReasonCode;
}

export interface DeleteCustomerResponse {
  app_user_id: string;
  deleted: boolean;
}
