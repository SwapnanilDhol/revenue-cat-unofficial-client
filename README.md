# revenue-cat-unofficial-client

Type-safe RevenueCat REST API v2 client for Node.js.

> This is an unofficial, community-maintained client. Not affiliated with RevenueCat.

Covers endpoints from the [RevenueCat v2 REST API](https://docs.revenuecat.com).

## Install

```bash
npm install revenue-cat-unofficial-client
```

## Quick Start

```js
import { RevenueCatClient } from 'revenue-cat-unofficial-client';

// From environment variables
// REVENUECAT_API_KEY=sk_...
// REVENUECAT_PROJECT_ID=proj_...
const client = RevenueCatClient.fromEnv();

// Or explicit
const client = new RevenueCatClient({
  apiKey: 'sk_...',
  projectId: 'proj_...',
});
```

## API

### Customers

```js
// List customers
const { items } = await client.listCustomers({ limit: 20 });

// Get a customer
const customer = await client.getCustomer('customer-id-123');

// Create a customer
const customer = await client.createCustomer({
  id: 'user-123',
  attributes: [{ name: '$email', value: 'user@example.com' }],
});

// Delete a customer
const deleted = await client.deleteCustomer('customer-id-123');

// Get customer subscriptions
const subs = await client.getCustomerSubscriptions('customer-id-123');

// Get customer purchases
const purchases = await client.getCustomerPurchases('customer-id-123');

// Get customer active entitlements
const entitlements = await client.getCustomerActiveEntitlements('customer-id-123');
```

### Customer Actions

```js
// Transfer customer to another
await client.transferCustomer('source-customer-id', {
  target_customer_id: 'target-customer-id',
  app_ids: ['app1', 'app2'],
});

// Grant entitlement
const updated = await client.grantEntitlement('customer-id', {
  entitlement_id: 'ent_123',
  expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
});

// Revoke entitlement
await client.revokeEntitlement('customer-id', {
  entitlement_id: 'ent_123',
});

// Assign offering override
await client.assignOffering('customer-id', {
  offering_id: 'ofrng_123', // or null to clear
});

// Restore Google Play purchase by order ID
const restored = await client.restorePurchaseByOrderId('customer-id', {
  order_id: 'GPA.1234-5678-9012',
});
```

### Customer Attributes

```js
// Get attributes
const attrs = await client.getCustomerAttributes('customer-id');

// Set attributes
await client.setCustomerAttributes('customer-id', {
  attributes: [
    { name: '$email', value: 'user@example.com' },
    { name: '$displayName', value: 'John Doe' },
    { name: 'custom_attr', value: 'value' }, // null to delete
  ],
});
```

### Subscriptions

```js
// Get subscription
const sub = await client.getSubscription('sub_123');

// Get subscription transactions
const txns = await client.getSubscriptionTransactions('sub_123', {
  sort: 'purchased_at',
  direction: 'desc',
});

// Get subscription entitlements
const entitlements = await client.getSubscriptionEntitlements('sub_123');

// Cancel (Web Billing subscription)
const updated = await client.cancelSubscription('sub_123');

// Extend subscription by days
const extended = await client.extendSubscriptionByDuration('sub_123', {
  extend_by_days: 14,
  extend_reason_code: 'customer_satisfaction',
});

// Extend subscription to date
const extended = await client.extendSubscriptionUntilDate('sub_123', {
  extend_until_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
  extend_reason_code: 'service_issue_or_outage',
});

// Refund (Web Billing subscription)
const refunded = await client.refundSubscription('sub_123');

// Refund specific transaction (Play Store)
const refunded = await client.refundSubscriptionTransaction('sub_123', 'GPA.0000-0000-0000');

// Get management URL
const { url } = await client.getSubscriptionAuthenticatedManagementUrl('sub_123');
```

### Purchases

```js
// Get purchase
const purchase = await client.getPurchase('purc_123');

// Get purchase entitlements
const entitlements = await client.getPurchaseEntitlements('purc_123');

// Refund (Web Billing purchase)
const refunded = await client.refundPurchase('purc_123');
```

### Virtual Currencies

```js
// Get customer balances
const balances = await client.getCustomerVirtualCurrencies('customer-id', {
  include_empty_balances: true,
});

// Create transaction
await client.createVirtualCurrencyTransaction('customer-id', {
  adjustments: { GLD: 100, SLVR: 50 },
  reference: 'achievement_unlock',
});

// Update balance (no transaction)
await client.updateVirtualCurrencyBalance('customer-id', {
  adjustments: { GLD: -10 },
});
```

### Projects & Apps

```js
// List projects
const { items: projects } = await client.listProjects();

// Get project
const project = await client.getProject(); // uses client's projectId

// List apps
const { items: apps } = await client.listApps();
```

### Entitlements, Products, Offerings, Packages

```js
// Entitlements
const { items: ents } = await client.listEntitlements();
const ent = await client.getEntitlement('ent_123');

// Products
const { items: prods } = await client.listProducts();
const prod = await client.getProduct('prod_123');

// Offerings
const { items: offrs } = await client.listOfferings();
const offr = await client.getOffering('ofrng_123');

// Packages
const pkg = await client.getPackage('pkge_123');
```

### Convenience Helpers

```js
// Check if user has any active entitlement
const isPro = await client.isProUser('customer-id');

// Check specific entitlement
const hasPro = await client.hasEntitlement('customer-id', 'pro_entitlement_id');
```

## Error Handling

```js
import { RevenueCatError, RevenueCatConfigError } from 'revenue-cat-unofficial-client';

try {
  await client.getCustomer('user-123');
} catch (err) {
  if (err instanceof RevenueCatError) {
    console.log(`API error ${err.statusCode}: ${err.body.message}`);
    console.log(`Error type: ${err.body.type}`);
    console.log(`Retryable: ${err.body.retryable}`);
  } else if (err instanceof RevenueCatConfigError) {
    console.log('Configuration error:', err.message);
  }
}
```

## TypeScript

Full type definitions are included.

```ts
import {
  RevenueCatClient,
  type Customer,
  type Subscription,
  type Entitlement,
  type Product,
  type Purchase,
  type Invoice,
  type Project,
  type App,
  type Offering,
  type Package,
} from 'revenue-cat-unofficial-client';
```

## Requirements

- Node.js 18+

## License

MIT