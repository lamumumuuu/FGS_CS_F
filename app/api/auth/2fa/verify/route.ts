/**
 * @file 登录两步验证 BFF — POST /api/auth/2fa/verify（验证预认证 token 并写入 Cookie）。
 */

import { NextResponse } from 'next/server';
import { applyAuthCookies, backendRequest, normalizeTokenPair } from '../../../server/backend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const upstream = await backendRequest('/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({
      two_factor_token: body.two_factor_token ?? body.twoFactorToken,
      code: body.code,
    }),
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }
  const pair = normalizeTokenPair(data);
  if (!pair) {
    return NextResponse.json({ error: '验证状态异常', code: 'AUTHENTICATION_FAILED' }, { status: 502 });
  }
  const res = NextResponse.json({ ok: true });
  applyAuthCookies(res, pair);
  return res;
}
