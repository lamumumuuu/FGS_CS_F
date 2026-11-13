/**
 * @file 公告 BFF — /api/announcements/*（公开列表 + 管理 CRUD/发布归档）。
 */

import { forwardAuthorized } from '../../server/forward';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  // 公开公告列表允许匿名读取；管理子路径仍由后端鉴权拒绝
  return forwardAuthorized(req, ctx, 'GET', '/announcements', { optionalAuth: true });
}

export async function POST(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'POST', '/announcements');
}

export async function PATCH(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'PATCH', '/announcements');
}

export async function DELETE(req: Request, ctx: Ctx) {
  return forwardAuthorized(req, ctx, 'DELETE', '/announcements');
}
