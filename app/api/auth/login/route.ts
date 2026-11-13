/**
 * @file 登录 BFF — POST /api/auth/login（同源薄转发 FastAPI，Cookie 托管 JWT）。
 */

import { NextResponse } from 'next/server';
import { applyAuthCookies, backendRequest, normalizeTokenPair } from '../../server/backend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = ((await req.json().catch(() => ({})).then((v) => v)) ?? {}) as Record<
    string,
    unknown
  >;

  const upstream = await backendRequest('/auth/login-json', {
    method: 'POST',
    body: JSON.stringify({
      username: body.username,
      password: body.password,
    }),
  });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const raw = data as Record<string, unknown>;
  // 后端 LoginResponse 为 camelCase 契约（requires2Fa / twoFactorToken）
  if (raw.requires2Fa === true || raw.requires_2fa === true) {
    return NextResponse.json({
      requires2fa: true,
      twoFactorToken: raw.twoFactorToken ?? raw.two_factor_token,
    });
  }

  const pair = normalizeTokenPair(raw);
  if (!pair) {
    return NextResponse.json({ error: '登录状态异常', code: 'AUTHENTICATION_FAILED' }, { status: 502 });
  }
  const res = NextResponse.json({ requires2fa: false });
  applyAuthCookies(res, pair);
  return res;
}
