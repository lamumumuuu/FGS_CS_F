/**
 * @file 统一余额档案 BFF — GET /api/wallet/me/profile。
 */

import { authorizedGet } from '../../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/wallet/me/profile');
}
