/**
 * @file 公开余额排行 BFF — GET /api/wallet/leaderboard。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/wallet/leaderboard');
}
