/**
 * @file 转账 BFF — POST /api/wallet/transfers（Cookie 身份 + Idempotency-Key）。
 */

import { authorizedRequest } from '../../server/backend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const idempotencyKey = req.headers.get('Idempotency-Key');
  const body = await req.text();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  return authorizedRequest('/wallet/transfers', {
    method: 'POST',
    body,
    headers,
  });
}
