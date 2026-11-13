/**
 * @file 本人权限 BFF — GET /api/rbac/me/permissions（两端同源权限集）。
 */

import { authorizedGet } from '../../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/rbac/me/permissions');
}
