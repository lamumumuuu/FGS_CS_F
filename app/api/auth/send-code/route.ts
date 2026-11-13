/**
 * @file 发送邮箱验证码 BFF — POST /api/auth/send-code。
 */

import { NextResponse } from 'next/server';
import { backendRequest } from '../../server/backend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const upstream = await backendRequest('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ email: body.email }),
  });
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
