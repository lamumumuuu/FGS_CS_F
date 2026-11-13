/**
 * @file 原生任务 BFF — /api/tasks/*。
 */

import { forwardAuthorized } from '../../server/forward';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'GET', '/tasks');
}

export async function POST(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'POST', '/tasks');
}

export async function PATCH(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'PATCH', '/tasks');
}

export async function DELETE(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'DELETE', '/tasks');
}
