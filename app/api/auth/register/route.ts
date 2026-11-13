/**
 * @file 注册 BFF — POST /api/auth/register（邮箱 + 密码 + 验证码，成功后写入 Cookie）。
 */

import { NextResponse } from 'next/server';
import { applyAuthCookies, backendRequest, normalizeTokenPair } from '../../server/backend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const upstream = await backendRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      code: body.code,
    }),
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }
  const pair = normalizeTokenPair(data);
  if (!pair) {
    return NextResponse.json({ error: '注册状态异常', code: 'AUTHENTICATION_FAILED' }, { status: 502 });
  }
  const res = NextResponse.json({ ok: true });
  applyAuthCookies(res, pair);
  return res;
}
