/**
 * @file 本人钱包 BFF — GET /api/wallet/me。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/wallet/me');
}
