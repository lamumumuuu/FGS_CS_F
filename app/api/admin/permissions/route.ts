/**
 * @file 权限点 BFF — GET /api/admin/permissions。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/admin/permissions');
}
