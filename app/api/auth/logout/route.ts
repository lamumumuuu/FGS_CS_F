/**
 * @file 登出 BFF — POST /api/auth/logout（撤销本站 refresh family 并清理 Cookie）。
 */

import { NextResponse } from 'next/server';
import {
  backendRequest,
  clearAuthCookies,
  readAuthCookies,
} from '../../server/backend';

export const runtime = 'nodejs';

export async function POST() {
  const { access, refresh } = await readAuthCookies();

  if (access) {
    await backendRequest(
      '/auth/logout',
      {
        method: 'POST',
        body: refresh ? JSON.stringify({ refresh_token: refresh }) : undefined,
      },
      access,
    ).catch(() => null);
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
