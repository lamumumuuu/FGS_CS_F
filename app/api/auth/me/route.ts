/**
 * @file 当前用户 BFF — GET /api/auth/me（Cookie → FastAPI，401 自动刷新一次）。
 */

import { authorizedGet } from '../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/auth/me');
}
