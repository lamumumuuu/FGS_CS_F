/**
 * @file 本人组织信息 BFF — GET /api/organization/me。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/organization/me');
}
