import * as crypto from 'crypto';

// Thin wrapper around PayHere's two separate credential/API surfaces:
//  - Merchant ID + Merchant Secret: used for Hosted Checkout hash generation
//    and IPN (webhook) signature verification. No network calls involved.
//  - App ID + App Secret: OAuth2 client-credentials pair for their REST
//    "Merchant API", used here only for the Refund endpoint.

export function isSandbox(): boolean {
  return (process.env.PAYHERE_SANDBOX ?? 'true').toLowerCase() !== 'false';
}

export function getPayHereCheckoutBaseUrl(): string {
  return isSandbox()
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';
}

export function getMerchantApiBaseUrl(): string {
  return isSandbox()
    ? 'https://sandbox.payhere.lk/merchant/v1'
    : 'https://www.payhere.lk/merchant/v1';
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// PayHere expects amounts formatted with exactly 2 decimal places in every
// hash/signature input and in the checkout form itself.
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

// Hash required in the Hosted Checkout form:
// upper(md5(merchant_id + order_id + amount + currency + upper(md5(merchant_secret))))
export function generateCheckoutHash(params: {
  orderId: string;
  amount: number;
  currency: string;
}): string {
  const merchantId = requireEnv('PAYHERE_MERCHANT_ID');
  const merchantSecret = requireEnv('PAYHERE_MERCHANT_SECRET');

  const secretHash = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const raw =
    merchantId +
    params.orderId +
    formatAmount(params.amount) +
    params.currency +
    secretHash;

  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
}

export function getMerchantId(): string {
  return requireEnv('PAYHERE_MERCHANT_ID');
}

export interface PayHereIpnPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  [key: string]: unknown;
}

// IPN signature check:
// upper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + upper(md5(merchant_secret))))
export function verifyIpnSignature(payload: PayHereIpnPayload): boolean {
  const merchantSecret = requireEnv('PAYHERE_MERCHANT_SECRET');

  const secretHash = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const raw =
    payload.merchant_id +
    payload.order_id +
    payload.payhere_amount +
    payload.payhere_currency +
    payload.status_code +
    secretHash;

  const localSig = crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
  return localSig === payload.md5sig?.toUpperCase();
}

// PayHere IPN status_code values: 2 = success, 0 = pending, -1 = cancelled,
// -2 = failed, -3 = charged back.
export const PAYHERE_STATUS_CODE = {
  SUCCESS: '2',
  PENDING: '0',
  CANCELLED: '-1',
  FAILED: '-2',
  CHARGED_BACK: '-3',
} as const;

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getMerchantApiAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const appId = requireEnv('PAYHERE_APP_ID');
  const appSecret = requireEnv('PAYHERE_APP_SECRET');
  const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64');

  const res = await fetch(`${getMerchantApiBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`PayHere OAuth token request failed (HTTP ${res.status})`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedAccessToken = {
    token: data.access_token,
    // Refresh a little early to avoid using a token that expires mid-request.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

// PayHere's Retrieval API (/payment/search) reports outcome via a string
// `status` field (e.g. "RECEIVED") - this is a different shape from the IPN
// webhook payload, which uses a numeric `status_code` (see PAYHERE_STATUS_CODE).
export interface PayHereRetrievedPayment {
  payment_id: string | number;
  order_id: string;
  status: string;
  amount: string | number;
  currency: string;
  [key: string]: unknown;
}

// The only documented success value for the Retrieval API's `status` field.
const RETRIEVAL_STATUS_SUCCESS = 'RECEIVED';

// Server-side confirmation of a payment via PayHere's Retrieval API, used as
// a fallback when the IPN webhook can't reach us (e.g. a local/sandbox build
// with no public URL) - the client asks us to check right after the native
// SDK reports completion, and we verify against PayHere rather than trusting
// the client's word for it.
export async function retrievePaymentByOrderId(
  orderId: string,
): Promise<PayHereRetrievedPayment | null> {
  const accessToken = await getMerchantApiAccessToken();

  const res = await fetch(
    `${getMerchantApiBaseUrl()}/payment/search?order_id=${encodeURIComponent(orderId)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PayHere payment search failed (HTTP ${res.status}): ${body}`);
  }

  const data = (await res.json()) as { data?: PayHereRetrievedPayment[] };
  const payments = data.data ?? [];
  if (payments.length === 0) return null;

  // PayHere doesn't enforce order_id uniqueness, so prefer a successful
  // attempt if one exists, otherwise fall back to the most recent entry.
  const success = payments.find(
    (p) => String(p.status).toUpperCase() === RETRIEVAL_STATUS_SUCCESS,
  );
  return success ?? payments[payments.length - 1];
}

// Translates the Retrieval API's string `status` into the same numeric
// codes `applyPaymentOutcome` uses for IPN payloads, so both paths share one
// state-transition function. Anything unrecognized is treated as still
// pending rather than failed - we'd rather leave a payment unresolved than
// wrongly mark a real success as failed because of an unmapped status string.
export function mapRetrievalStatusToCode(status: string): string {
  return String(status).toUpperCase() === RETRIEVAL_STATUS_SUCCESS
    ? PAYHERE_STATUS_CODE.SUCCESS
    : PAYHERE_STATUS_CODE.PENDING;
}

// Issues a refund for a completed PayHere payment. `amount` omitted = full refund.
export async function refundPayment(params: {
  payherePaymentId: string;
  amount?: number;
  description: string;
}): Promise<void> {
  const accessToken = await getMerchantApiAccessToken();

  const res = await fetch(`${getMerchantApiBaseUrl()}/payment/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      payment_id: params.payherePaymentId,
      ...(params.amount !== undefined
        ? { amount: formatAmount(params.amount) }
        : {}),
      description: params.description,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `PayHere refund request failed (HTTP ${res.status}): ${body}`,
    );
  }
}
