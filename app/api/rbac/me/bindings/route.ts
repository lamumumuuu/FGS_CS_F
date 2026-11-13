/**
 * @file 本人角色绑定 BFF — GET /api/rbac/me/bindings（角色 + 作用范围 + 授权版本）。
 */

import { authorizedGet } from '../../../server/backend';

export const runtime = 'nodejs';

export async function GET() {
  return authorizedGet('/rbac/me/bindings');
}
