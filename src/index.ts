// ============================================================
// revenuecat-client — Public API (v2)
// ============================================================

export { RevenueCatClient } from "./client";
export type { RevenueCatClientOptions } from "./client";

export {
  RevenueCatError,
  RevenueCatConfigError,
  RevenueCatTransportError,
  RevenueCatResponseTooLargeError,
} from "./errors";

export type {
  // Enums / Unions
  Environment,
  Store,
  Ownership,
  SubscriptionStatus,
  AutoRenewalStatus,
  Duration,
  ExtendReasonCode,

  // Common
  ListResponse,
  MonetaryAmount,

  // Models
  Customer,
  CustomerEntitlement,
  CustomerAttribute,
  CustomerAlias,
  ExperimentEnrollment,
  Subscription,
  Purchase,
  Entitlement,
  Product,
  Offering,
  Package,
  Invoice,
  InvoiceLineItem,
  Project,
  App,
  DeletedObject,
  RevenueCatApiError,

  // Request types
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
