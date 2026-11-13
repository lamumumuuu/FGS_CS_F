/**
 * @file 收款人搜索 BFF — GET /api/wallet/recipients?q=。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const search = new URL(req.url).search;
  return authorizedGet(`/wallet/recipients${search}`);
}
