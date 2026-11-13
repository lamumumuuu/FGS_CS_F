/**
 * @file 管理员成果验收 BFF — /api/admin/task-submissions/*。
 */

import { forwardAuthorized } from '../../../server/forward';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function POST(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'POST', '/admin/task-submissions');
}

export async function GET(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'GET', '/admin/task-submissions');
}
