/**
 * @file 峰列表 BFF — GET /api/organization/peaks。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const search = new URL(req.url).search;
  return authorizedGet(`/organization/peaks${search}`);
}
