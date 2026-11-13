/**
 * @file 活动 BFF — /api/events/*（列表、详情、报名、我的活动）。
 */

import { forwardAuthorized } from '../../server/forward';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'GET', '/events');
}

export async function POST(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'POST', '/events');
}

export async function DELETE(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'DELETE', '/events');
}
