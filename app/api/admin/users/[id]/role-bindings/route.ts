/**
 * @file 用户角色绑定 BFF — GET/PUT /api/admin/users/[id]/role-bindings
 *
 * 直接转发到 FastAPI：请求体转 snake_case，If-Match 携带授权版本。
 */

import { authorizedRequest } from '../../../../server/backend';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return authorizedRequest(`/admin/users/${id}/role-bindings`, { method: 'GET' });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const payload = (await req.json().catch(() => ({}))) as {
    version?: number;
    bindings?: Array<{ roleId?: number; scopeType?: string; scopePeakId?: number | null }>;
  };

  const headers: Record<string, string> = {};
  if (typeof payload.version === 'number') {
    headers['If-Match'] = `"${payload.version}"`;
  }

  const bindings = (payload.bindings ?? [])
    .map((item) => ({
      role_id: Number(item.roleId),
      scope_type: item.scopeType === 'peak' || item.scopeType === 'all' ? item.scopeType : 'own',
      scope_peak_id: item.scopePeakId ? Number(item.scopePeakId) : null,
    }))
    .filter((item) => Number.isInteger(item.role_id) && item.role_id > 0);

  return authorizedRequest(`/admin/users/${id}/role-bindings`, {
    method: 'PUT',
    body: JSON.stringify({ bindings }),
    headers,
  });
}
