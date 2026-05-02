import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RevenueCatClient } from '../src/client';
import type { RevenueCatApiError } from '../src/types';

const TEST_API_KEY = 'sk_test_123';
const TEST_PROJECT_ID = 'proj_test_123';
const TEST_BASE_URL = 'https://api.revenuecat.com/v2';

function createMockClient() {
  return new RevenueCatClient({
    apiKey: TEST_API_KEY,
    projectId: TEST_PROJECT_ID,
  });
}

function createMockClientWithBaseUrl(baseUrl: string) {
  return new RevenueCatClient({
    apiKey: TEST_API_KEY,
    projectId: TEST_PROJECT_ID,
    baseUrl,
  });
}

function createOkResponse<T>(data: T, status = 200) {
  return {
    ok: true,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

function createErrorResponse(error: RevenueCatApiError, status: number) {
  return {
    ok: false,
    status,
    statusText: error.message,
    json: () => Promise.resolve(error),
  } as unknown as Response;
}

describe('RevenueCatClient', () => {
  let client: RevenueCatClient;

  beforeEach(() => {
    client = createMockClient();
    global.fetch = vi.fn();
  });

  describe('constructor', () => {
    it('creates client with valid options', () => {
      const c = createMockClient();
      expect(c).toBeInstanceOf(RevenueCatClient);
    });

    it('throws RevenueCatConfigError when apiKey is missing', () => {
      expect(() => new RevenueCatClient({ apiKey: '', projectId: 'proj_123' })).toThrow(
        'RevenueCat API key is required'
      );
    });

    it('throws RevenueCatConfigError when projectId is missing', () => {
      expect(() => new RevenueCatClient({ apiKey: 'sk_123', projectId: '' })).toThrow(
        'RevenueCat project ID is required'
      );
    });

    it('uses custom baseUrl when provided', () => {
      const c = createMockClientWithBaseUrl('http://localhost:3000');
      expect(c).toBeInstanceOf(RevenueCatClient);
    });
  });

  describe('fromEnv', () => {
    it('creates client from environment variables', () => {
      const originalApiKey = process.env.REVENUECAT_API_KEY;
      const originalProjectId = process.env.REVENUECAT_PROJECT_ID;

      process.env.REVENUECAT_API_KEY = 'sk_env_123';
      process.env.REVENUECAT_PROJECT_ID = 'proj_env_456';

      const c = RevenueCatClient.fromEnv();
      expect(c).toBeInstanceOf(RevenueCatClient);

      process.env.REVENUECAT_API_KEY = originalApiKey;
      process.env.REVENUECAT_PROJECT_ID = originalProjectId;
    });

    it('throws RevenueCatConfigError when REVENUECAT_API_KEY is not set', () => {
      const originalApiKey = process.env.REVENUECAT_API_KEY;
      const originalProjectId = process.env.REVENUECAT_PROJECT_ID;

      delete process.env.REVENUECAT_API_KEY;
      process.env.REVENUECAT_PROJECT_ID = 'proj_123';

      expect(() => RevenueCatClient.fromEnv()).toThrow(
        'REVENUECAT_API_KEY environment variable is not set'
      );

      process.env.REVENUECAT_API_KEY = originalApiKey;
      process.env.REVENUECAT_PROJECT_ID = originalProjectId;
    });

    it('throws RevenueCatConfigError when REVENUECAT_PROJECT_ID is not set', () => {
      const originalApiKey = process.env.REVENUECAT_API_KEY;
      const originalProjectId = process.env.REVENUECAT_PROJECT_ID;

      process.env.REVENUECAT_API_KEY = 'sk_123';
      delete process.env.REVENUECAT_PROJECT_ID;

      expect(() => RevenueCatClient.fromEnv()).toThrow(
        'REVENUECAT_PROJECT_ID environment variable is not set'
      );

      process.env.REVENUECAT_API_KEY = originalApiKey;
      process.env.REVENUECAT_PROJECT_ID = originalProjectId;
    });
  });

  describe('Customers', () => {
    it('listCustomers makes GET request with correct path and params', async () => {
      const mockData = {
        object: 'list',
        items: [],
        next_page: null,
        url: '/v2/projects/proj_test_123/customers',
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      const result = await client.listCustomers({ limit: 10 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${TEST_BASE_URL}/projects/${TEST_PROJECT_ID}/customers`),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('getCustomer makes GET request with correct path', async () => {
      const mockCustomer = { object: 'customer', id: 'cust_123', project_id: TEST_PROJECT_ID };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockCustomer));

      const result = await client.getCustomer('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${TEST_BASE_URL}/projects/${TEST_PROJECT_ID}/customers/cust_123`),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockCustomer);
    });

    it('getCustomer encodes special characters in customerId', async () => {
      const mockCustomer = { object: 'customer', id: 'cust_with spaces', project_id: TEST_PROJECT_ID };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockCustomer));

      await client.getCustomer('cust_with spaces');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cust_with%20spaces'),
        expect.any(Object)
      );
    });

    it('getCustomer with expand option includes expand query param', async () => {
      const mockCustomer = { object: 'customer', id: 'cust_123', project_id: TEST_PROJECT_ID };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockCustomer));

      await client.getCustomer('cust_123', { expand: ['attributes'] });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('expand=attributes'),
        expect.any(Object)
      );
    });

    it('createCustomer makes POST request with correct path and body', async () => {
      const mockCustomer = { object: 'customer', id: 'new_cust', project_id: TEST_PROJECT_ID };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockCustomer, 201));

      const result = await client.createCustomer({
        id: 'new_cust',
        attributes: [{ name: '$email', value: 'test@example.com' }],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${TEST_BASE_URL}/projects/${TEST_PROJECT_ID}/customers`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            id: 'new_cust',
            attributes: [{ name: '$email', value: 'test@example.com' }],
          }),
        })
      );
      expect(result).toEqual(mockCustomer);
    });

    it('deleteCustomer makes DELETE request with correct path', async () => {
      const mockDeleted = { object: 'customer', id: 'cust_123', deleted_at: Date.now() };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockDeleted));

      await client.deleteCustomer('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${TEST_BASE_URL}/projects/${TEST_PROJECT_ID}/customers/cust_123`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('transferCustomer makes POST request with target_customer_id', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse({}));

      await client.transferCustomer('source_123', { target_customer_id: 'target_456' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('transfer'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ target_customer_id: 'target_456' }),
        })
      );
    });

    it('grantEntitlement makes POST request with entitlement_id and expires_at', async () => {
      const mockCustomer = { object: 'customer', id: 'cust_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockCustomer));

      const expiresAt = Date.now() + 86400000;
      await client.grantEntitlement('cust_123', { entitlement_id: 'ent_123', expires_at: expiresAt });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('grant_entitlement'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ entitlement_id: 'ent_123', expires_at: expiresAt }),
        })
      );
    });

    it('revokeEntitlement makes POST request with entitlement_id', async () => {
      const mockCustomer = { object: 'customer', id: 'cust_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockCustomer));

      await client.revokeEntitlement('cust_123', { entitlement_id: 'ent_123' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('revoke_granted_entitlement'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ entitlement_id: 'ent_123' }),
        })
      );
    });

    it('assignOffering makes POST request with offering_id', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse({}));

      await client.assignOffering('cust_123', { offering_id: 'ofrng_123' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('assign_offering'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ offering_id: 'ofrng_123' }),
        })
      );
    });

    it('assignOffering can clear offering by passing null', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse({}));

      await client.assignOffering('cust_123', { offering_id: null });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ offering_id: null }),
        })
      );
    });
  });

  describe('Customer Attributes', () => {
    it('getCustomerAttributes makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerAttributes('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/attributes'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('setCustomerAttributes makes POST request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.setCustomerAttributes('cust_123', {
        attributes: [{ name: '$email', value: 'new@example.com' }],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/attributes'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Customer Active Entitlements', () => {
    it('getCustomerActiveEntitlements makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerActiveEntitlements('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/active_entitlements'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Customer Aliases', () => {
    it('getCustomerAliases makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerAliases('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/aliases'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Customer Subscriptions', () => {
    it('getCustomerSubscriptions makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerSubscriptions('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getCustomerSubscriptions passes environment filter', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerSubscriptions('cust_123', { environment: 'sandbox' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('environment=sandbox'),
        expect.any(Object)
      );
    });
  });

  describe('Customer Purchases', () => {
    it('getCustomerPurchases makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerPurchases('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/purchases'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Customer Invoices', () => {
    it('getCustomerInvoices makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerInvoices('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/invoices'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getCustomerInvoiceFile makes GET request to invoice file endpoint', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      } as unknown as Response);

      await client.getCustomerInvoiceFile('cust_123', 'inv_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/invoices/inv_123/file'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Bearer ${TEST_API_KEY}` }),
        })
      );
    });
  });

  describe('Customer Virtual Currencies', () => {
    it('getCustomerVirtualCurrencies makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getCustomerVirtualCurrencies('cust_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/virtual_currencies'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('createVirtualCurrencyTransaction makes POST request with adjustments', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.createVirtualCurrencyTransaction('cust_123', {
        adjustments: { GLD: 100, SLVR: 50 },
        reference: 'achievement',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/virtual_currencies/transactions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ adjustments: { GLD: 100, SLVR: 50 }, reference: 'achievement' }),
        })
      );
    });

    it('createVirtualCurrencyTransaction sends idempotency key when provided', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.createVirtualCurrencyTransaction(
        'cust_123',
        { adjustments: { GLD: 100 } },
        'idempotency-key-123'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Idempotency-Key': 'idempotency-key-123' }),
        })
      );
    });
  });

  describe('Subscriptions', () => {
    it('getSubscription makes GET request', async () => {
      const mockSub = { object: 'subscription', id: 'sub_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockSub));

      await client.getSubscription('sub_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/sub_123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getSubscriptionTransactions makes GET request with pagination', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getSubscriptionTransactions('sub_123', {
        sort: 'purchased_at',
        direction: 'desc',
        limit: 50,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=purchased_at'),
        expect.any(Object)
      );
    });

    it('cancelSubscription makes POST request', async () => {
      const mockSub = { object: 'subscription', id: 'sub_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockSub));

      await client.cancelSubscription('sub_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/cancel'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('extendSubscriptionByDuration sends extend_by_days', async () => {
      const mockSub = { object: 'subscription', id: 'sub_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockSub));

      await client.extendSubscriptionByDuration('sub_123', {
        extend_by_days: 14,
        extend_reason_code: 'customer_satisfaction',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ extend_by_days: 14, extend_reason_code: 'customer_satisfaction' }),
        })
      );
    });

    it('extendSubscriptionUntilDate sends extend_until_ms', async () => {
      const mockSub = { object: 'subscription', id: 'sub_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockSub));

      const futureDate = Date.now() + 30 * 86400000;
      await client.extendSubscriptionUntilDate('sub_123', {
        extend_until_ms: futureDate,
        extend_reason_code: 'service_issue_or_outage',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ extend_until_ms: futureDate, extend_reason_code: 'service_issue_or_outage' }),
        })
      );
    });

    it('refundSubscription makes POST request', async () => {
      const mockSub = { object: 'subscription', id: 'sub_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockSub));

      await client.refundSubscription('sub_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/refund'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('refundSubscriptionTransaction sends transaction ID in path', async () => {
      const mockSub = { object: 'subscription', id: 'sub_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockSub));

      await client.refundSubscriptionTransaction('sub_123', 'txn_GPA.0000');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/txn_GPA.0000/actions/refund'),
        expect.any(Object)
      );
    });

    it('getSubscriptionAuthenticatedManagementUrl makes GET request', async () => {
      const mockUrl = { url: 'https://manage.example.com/sub_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockUrl));

      await client.getSubscriptionAuthenticatedManagementUrl('sub_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/authenticated_management_url'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Purchases', () => {
    it('getPurchase makes GET request', async () => {
      const mockPurchase = { object: 'purchase', id: 'purc_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockPurchase));

      await client.getPurchase('purc_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/purchases/purc_123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getPurchaseEntitlements makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.getPurchaseEntitlements('purc_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/entitlements'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('refundPurchase makes POST request', async () => {
      const mockPurchase = { object: 'purchase', id: 'purc_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockPurchase));

      await client.refundPurchase('purc_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/refund'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Entitlements', () => {
    it('listEntitlements makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listEntitlements();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/entitlements'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getEntitlement makes GET request', async () => {
      const mockEnt = { object: 'entitlement', id: 'ent_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockEnt));

      await client.getEntitlement('ent_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/entitlements/ent_123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('createEntitlement makes POST request', async () => {
      const mockEnt = { object: 'entitlement', id: 'ent_new' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockEnt, 201));

      await client.createEntitlement({ lookup_key: 'premium', display_name: 'Premium' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/entitlements'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ lookup_key: 'premium', display_name: 'Premium' }),
        })
      );
    });

    it('updateEntitlement makes POST request', async () => {
      const mockEnt = { object: 'entitlement', id: 'ent_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockEnt));

      await client.updateEntitlement('ent_123', { display_name: 'Updated Name' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/entitlements/ent_123'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ display_name: 'Updated Name' }),
        })
      );
    });

    it('deleteEntitlement makes DELETE request', async () => {
      const mockDeleted = { object: 'entitlement', id: 'ent_123', deleted_at: Date.now() };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockDeleted));

      await client.deleteEntitlement('ent_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/entitlements/ent_123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('archiveEntitlement makes POST to archive action', async () => {
      const mockEnt = { object: 'entitlement', id: 'ent_123', state: 'inactive' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockEnt));

      await client.archiveEntitlement('ent_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/archive'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('unarchiveEntitlement makes POST to unarchive action', async () => {
      const mockEnt = { object: 'entitlement', id: 'ent_123', state: 'active' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockEnt));

      await client.unarchiveEntitlement('ent_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/unarchive'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('attachProductsToEntitlement sends product_ids', async () => {
      const mockEnt = { object: 'entitlement', id: 'ent_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockEnt));

      await client.attachProductsToEntitlement('ent_123', { product_ids: ['prod_1', 'prod_2'] });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/attach_products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ product_ids: ['prod_1', 'prod_2'] }),
        })
      );
    });

    it('detachProductsFromEntitlement sends product_ids', async () => {
      const mockEnt = { object: 'entitlement', id: 'ent_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockEnt));

      await client.detachProductsFromEntitlement('ent_123', { product_ids: ['prod_1'] });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/detach_products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ product_ids: ['prod_1'] }),
        })
      );
    });
  });

  describe('Products', () => {
    it('listProducts makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('listProducts passes app_id filter', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listProducts({ app_id: 'app_123' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('app_id=app_123'),
        expect.any(Object)
      );
    });

    it('getProduct makes GET request', async () => {
      const mockProd = { object: 'product', id: 'prod_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockProd));

      await client.getProduct('prod_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/prod_123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('updateProduct makes POST request', async () => {
      const mockProd = { object: 'product', id: 'prod_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockProd));

      await client.updateProduct('prod_123', { display_name: 'New Name' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/prod_123'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ display_name: 'New Name' }),
        })
      );
    });

    it('deleteProduct makes DELETE request', async () => {
      const mockDeleted = { object: 'product', id: 'prod_123', deleted_at: Date.now() };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockDeleted));

      await client.deleteProduct('prod_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/prod_123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('archiveProduct makes POST to archive action', async () => {
      const mockProd = { object: 'product', id: 'prod_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockProd));

      await client.archiveProduct('prod_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/archive'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('unarchiveProduct makes POST to unarchive action', async () => {
      const mockProd = { object: 'product', id: 'prod_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockProd));

      await client.unarchiveProduct('prod_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/unarchive'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Offerings', () => {
    it('listOfferings makes GET request', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listOfferings();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offerings'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getOffering makes GET request', async () => {
      const mockOffering = { object: 'offering', id: 'ofrng_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockOffering));

      await client.getOffering('ofrng_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offerings/ofrng_123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('createOffering makes POST request', async () => {
      const mockOffering = { object: 'offering', id: 'ofrng_new' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockOffering, 201));

      await client.createOffering({ lookup_key: 'default', display_name: 'Default Offering' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offerings'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ lookup_key: 'default', display_name: 'Default Offering' }),
        })
      );
    });

    it('updateOffering makes POST request', async () => {
      const mockOffering = { object: 'offering', id: 'ofrng_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockOffering));

      await client.updateOffering('ofrng_123', { display_name: 'Updated', is_current: true });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offerings/ofrng_123'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ display_name: 'Updated', is_current: true }),
        })
      );
    });

    it('deleteOffering makes DELETE request', async () => {
      const mockDeleted = { object: 'offering', id: 'ofrng_123', deleted_at: Date.now() };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockDeleted));

      await client.deleteOffering('ofrng_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offerings/ofrng_123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('archiveOffering makes POST to archive action', async () => {
      const mockOffering = { object: 'offering', id: 'ofrng_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockOffering));

      await client.archiveOffering('ofrng_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/archive'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('unarchiveOffering makes POST to unarchive action', async () => {
      const mockOffering = { object: 'offering', id: 'ofrng_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockOffering));

      await client.unarchiveOffering('ofrng_123', { unarchive_referenced_entities: true });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/actions/unarchive'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ unarchive_referenced_entities: true }),
        })
      );
    });
  });

  describe('Packages', () => {
    it('listPackages makes GET request with offering_id', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listPackages('ofrng_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offerings/ofrng_123/packages'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getPackage makes GET request', async () => {
      const mockPkg = { object: 'package', id: 'pkge_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockPkg));

      await client.getPackage('pkge_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/pkge_123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('createPackage makes POST request', async () => {
      const mockPkg = { object: 'package', id: 'pkge_new' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockPkg, 201));

      await client.createPackage('ofrng_123', { lookup_key: 'monthly', display_name: 'Monthly Package' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/offerings/ofrng_123/packages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ lookup_key: 'monthly', display_name: 'Monthly Package' }),
        })
      );
    });

    it('updatePackage makes POST request', async () => {
      const mockPkg = { object: 'package', id: 'pkge_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockPkg));

      await client.updatePackage('pkge_123', { display_name: 'Updated Package', position: 2 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/pkge_123'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ display_name: 'Updated Package', position: 2 }),
        })
      );
    });

    it('deletePackage makes DELETE request', async () => {
      const mockDeleted = { object: 'package', id: 'pkge_123', deleted_at: Date.now() };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockDeleted));

      await client.deletePackage('pkge_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/pkge_123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('attachProductsToPackage sends products array', async () => {
      const mockPkg = { object: 'package', id: 'pkge_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockPkg));

      await client.attachProductsToPackage('pkge_123', {
        products: [
          { product_id: 'prod_1', eligibility_criteria: 'all' },
          { product_id: 'prod_2', eligibility_criteria: 'google_sdk_ge_6' },
        ],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/attach_products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            products: [
              { product_id: 'prod_1', eligibility_criteria: 'all' },
              { product_id: 'prod_2', eligibility_criteria: 'google_sdk_ge_6' },
            ],
          }),
        })
      );
    });

    it('detachProductsFromPackage sends product_ids', async () => {
      const mockPkg = { object: 'package', id: 'pkge_123' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockPkg));

      await client.detachProductsFromPackage('pkge_123', { product_ids: ['prod_1'] });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/detach_products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ product_ids: ['prod_1'] }),
        })
      );
    });
  });

  describe('Search', () => {
    it('searchSubscriptions makes GET request with store_subscription_identifier', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.searchSubscriptions('GPA.1234-5678-9012');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('store_subscription_identifier=GPA.1234-5678-9012'),
        expect.any(Object)
      );
    });

    it('searchPurchases makes GET request with store_purchase_identifier', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.searchPurchases('GPA.1234-5678-9012');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('store_purchase_identifier=GPA.1234-5678-9012'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('throws RevenueCatError on non-ok response', async () => {
      const errorBody: RevenueCatApiError = {
        object: 'error',
        type: 'parameter_error',
        message: 'customer_id is too long',
        retryable: false,
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createErrorResponse(errorBody, 400)
      );

      await expect(client.getCustomer('cust_123')).rejects.toThrow('customer_id is too long');
    });

    it('parses error body correctly on non-ok response', async () => {
      const errorBody: RevenueCatApiError = {
        object: 'error',
        type: 'resource_missing',
        message: 'Resource not found',
        doc_url: 'https://errors.rev.cat/resource-missing',
        retryable: false,
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createErrorResponse(errorBody, 404)
      );

      try {
        await client.getCustomer('nonexistent');
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(404);
        expect(err.body.type).toBe('resource_missing');
        expect(err.body.doc_url).toBe('https://errors.rev.cat/resource-missing');
      }
    });
  });

  describe('Authorization Header', () => {
    it('includes Bearer token in Authorization header', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listCustomers();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TEST_API_KEY}`,
          }),
        })
      );
    });

    it('includes Content-Type application/json header', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listCustomers();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Pagination params', () => {
    it('passes starting_after parameter', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listCustomers({ starting_after: 'cust_last_id' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('starting_after=cust_last_id'),
        expect.any(Object)
      );
    });

    it('passes limit parameter', async () => {
      const mockData = { object: 'list', items: [], next_page: null, url: '' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

      await client.listCustomers({ limit: 50 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });
  });
});

describe('Convenience helpers', () => {
  let client: RevenueCatClient;

  beforeEach(() => {
    client = createMockClient();
    global.fetch = vi.fn();
  });

  it('hasActiveEntitlements returns true when entitlements exist', async () => {
    const mockData = {
      object: 'list',
      items: [{ object: 'customer.active_entitlement', entitlement_id: 'ent_1' }],
      next_page: null,
      url: '',
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

    const result = await client.hasActiveEntitlements('cust_123');

    expect(result).toBe(true);
  });

  it('hasActiveEntitlements returns false when no entitlements', async () => {
    const mockData = { object: 'list', items: [], next_page: null, url: '' };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

    const result = await client.hasActiveEntitlements('cust_123');

    expect(result).toBe(false);
  });

  it('hasEntitlement returns true when specific entitlement found', async () => {
    const mockData = {
      object: 'list',
      items: [
        { object: 'customer.active_entitlement', entitlement_id: 'ent_premium' },
        { object: 'customer.active_entitlement', entitlement_id: 'ent_basic' },
      ],
      next_page: null,
      url: '',
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

    const result = await client.hasEntitlement('cust_123', 'ent_premium');

    expect(result).toBe(true);
  });

  it('hasEntitlement returns false when specific entitlement not found', async () => {
    const mockData = {
      object: 'list',
      items: [{ object: 'customer.active_entitlement', entitlement_id: 'ent_basic' }],
      next_page: null,
      url: '',
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createOkResponse(mockData));

    const result = await client.hasEntitlement('cust_123', 'ent_premium');

    expect(result).toBe(false);
  });
});