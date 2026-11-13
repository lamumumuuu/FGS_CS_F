/**
 * @file 管理端活动 BFF — /api/admin/events/*。
 */

import { forwardAuthorized } from '../../../server/forward';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'GET', '/admin/events');
}

export async function POST(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'POST', '/admin/events');
}

export async function PUT(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'PUT', '/admin/events');
}

export async function DELETE(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'DELETE', '/admin/events');
}
