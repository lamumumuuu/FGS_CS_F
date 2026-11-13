/**
 * @file 统一授权 BFF — /api/admin/roles/*（角色 CRUD、整组替换权限）。
 */

import { forwardAuthorized } from '../../../server/forward';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'GET', '/admin/roles');
}

export async function POST(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'POST', '/admin/roles');
}

export async function PATCH(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'PATCH', '/admin/roles');
}

export async function DELETE(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'DELETE', '/admin/roles');
}

export async function PUT(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'PUT', '/admin/roles');
}
