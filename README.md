# @passmaker/revenuecat-client

Type-safe RevenueCat REST API v1 client for Node.js. Covers all endpoints from the [RevenueCat v1 API](https://docs.revenuecat.com/api-v1).

## Install

```bash
npm install @passmaker/revenuecat-client
```

## Quick Start

```js
const { RevenueCatClient } = require('@passmaker/revenuecat-client');

// From environment variable (REVENUECAT_API_KEY)
const client = RevenueCatClient.fromEnv();

// Or explicit
const client = new RevenueCatClient({ apiKey: 'sk_...' });
```

## API

### Customers

```js
// Get or create a customer
const customer = await client.getCustomer('user-123');

// Delete a customer
await client.deleteCustomer('user-123');

// Update customer attributes
await client.updateAttributes('user-123', {
  attributes: {
    email: { value: 'user@example.com' }
  }
});
```

### Entitlements

```js
// Grant a promotional entitlement
await client.grantEntitlement('user-123', 'pro', {
  end_time_ms: Date.now() + 30 * 24 * 60 * 60 * 1000
});

// Revoke promotional entitlements
await client.revokePromotionalEntitlements('user-123', 'pro');
```

### Transactions

```js
// Record a purchase
await client.createPurchase({
  app_user_id: 'user-123',
  fetch_token: 'receipt-data'
}, 'ios');

// Google: Refund and revoke subscription
await client.revokeGoogleSubscription('user-123', 'monthly');

// Google: Refund a purchase
await client.refundGooglePurchase('user-123', 'GPA.3309-9122-6177-45730');

// Google: Cancel subscription
await client.cancelGoogleSubscription('user-123', 'GPA.3309-9122-6177-45730');

// Google: Defer subscription
await client.deferGoogleSubscription('user-123', 'monthly', {
  extend_by_days: 30
});

// Apple: Extend subscription
await client.extendAppleSubscription('user-123', '1000000819074923', {
  extend_by_days: 30,
  extend_reason_code: 1
});
```

### Offerings

```js
// Get offerings
const offerings = await client.getOfferings('user-123');

// Override offering for a customer
await client.overrideOffering('user-123', 'ofrng1234567abc');

// Remove offering override
await client.removeOfferingOverride('user-123');
```

### Convenience Helpers

```js
// Check if user has any active entitlement (Pro check)
const isPro = await client.isProUser('user-123');

// Check a specific entitlement
const hasPro = await client.hasActiveEntitlement('user-123', 'pro');
```

### Error Handling

```js
const { RevenueCatError, RevenueCatConfigError } = require('@passmaker/revenuecat-client');

try {
  await client.getCustomer('user-123');
} catch (err) {
  if (err instanceof RevenueCatError) {
    console.log(`API error ${err.statusCode}: ${err.body.message}`);
  }
}
```

## TypeScript

Full type definitions are included. All request/response types are exported:

```ts
import {
  RevenueCatClient,
  type CustomerInfoResponse,
  type Subscriber,
  type Entitlements,
} from '@passmaker/revenuecat-client';
```

## Requirements

- Node.js 18+

## License

MIT
