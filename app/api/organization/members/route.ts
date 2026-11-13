/**
 * @file 成员列表 BFF — GET /api/organization/members。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const search = new URL(req.url).search;
  return authorizedGet(`/organization/members${search}`);
}
