// ============================================================
// @passmaker/revenuecat-client — Public API
// ============================================================

export { RevenueCatClient } from "./client";
export type { RevenueCatClientOptions } from "./client";

export {
  RevenueCatError,
  RevenueCatConfigError,
} from "./errors";

export type {
  // Enums / Unions
  Platform,
  Store,
  OwnershipType,
  PeriodType,
  AttributionNetwork,
  PromotionalDuration,
  PaymentMode,
  ExtendReasonCode,

  // Models
  EntitlementInfo,
  Entitlements,
  NonSubscriptionPurchase,
  NonSubscriptions,
  SubscriptionInfo,
  Subscriptions,
  SubscriberAttribute,
  SubscriberAttributes,
  Subscriber,
  CustomerInfoResponse,
  Package,
  Offering,
  OfferingsResponse,
  RevenueCatApiError,
  DeleteCustomerResponse,

  // Request types
  CreatePurchaseRequest,
  GrantEntitlementRequest,
  UpdateAttributesRequest,
  AddAttributionRequest,
  DeferSubscriptionRequest,
  ExtendAppleSubscriptionRequest,
} from "./types";
