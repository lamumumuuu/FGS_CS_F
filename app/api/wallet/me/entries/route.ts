/**
 * @file 本人钱包流水 BFF — GET /api/wallet/me/entries（透传分页参数）。
 */

import { authorizedGet } from '../../../server/backend';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const search = new URL(req.url).search;
  return authorizedGet(`/wallet/me/entries${search}`);
}
