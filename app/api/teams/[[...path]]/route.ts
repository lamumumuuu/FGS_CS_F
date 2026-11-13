/**
 * @file 团队 BFF — /api/teams/*。
 */

import { forwardAuthorized } from '../../server/forward';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'GET', '/teams');
}

export async function POST(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'POST', '/teams');
}

export async function PATCH(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'PATCH', '/teams');
}

export async function DELETE(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'DELETE', '/teams');
}
