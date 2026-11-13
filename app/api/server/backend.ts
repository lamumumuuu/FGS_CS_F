/**
 * @file 旧端同源 BFF 的 server-only 后端客户端（统一 FastAPI）。
 *
 * 职责：读取 HttpOnly Cookie 中的访问令牌、转发请求到 FastAPI、401 时用 refresh
 * Cookie 刷新并重试一次、更新/清理本站 Cookie。浏览器不接触 JWT，也不再从
 * localStorage 读取令牌。此文件仅可在 Route Handler / Server Component 使用。
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://127.0.0.1:9000').replace(/\/$/, '');
const API_PREFIX = '/api/v1';

const IS_PROD = process.env.NODE_ENV === 'production';
export const ACCESS_COOKIE = IS_PROD ? '__Host-fgscs_access' : 'fgscs_access';
export const REFRESH_COOKIE = IS_PROD ? '__Host-fgscs_refresh' : 'fgscs_refresh';

const ACCESS_MAX_AGE = 60 * 30;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

export interface BackendTokenPair {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
}

export function normalizeTokenPair(body: unknown): BackendTokenPair | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;
  const access = (raw.accessToken ?? raw.access_token) as string | undefined;
  const refresh = (raw.refreshToken ?? raw.refresh_token) as string | undefined;
  if (!access || !refresh) return null;
  return { accessToken: access, refreshToken: refresh };
}

export async function readAuthCookies(): Promise<{ access?: string; refresh?: string }> {
  const store = await cookies();
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}

export function applyAuthCookies(res: NextResponse, pair: BackendTokenPair): void {
  const secure = IS_PROD;
  if (pair.accessToken) {
    res.cookies.set(ACCESS_COOKIE, pair.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_MAX_AGE,
    });
  }
  if (pair.refreshToken) {
    res.cookies.set(REFRESH_COOKIE, pair.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, secure: IS_PROD, path: '/', maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, secure: IS_PROD, path: '/', maxAge: 0 });
}

async function backendRequest(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(`${BACKEND_URL}${API_PREFIX}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

async function refreshPair(): Promise<BackendTokenPair | null> {
  const { refresh } = await readAuthCookies();
  if (!refresh) return null;
  const upstream = await backendRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!upstream.ok) return null;
  return normalizeTokenPair(await upstream.json().catch(() => null));
}

/**
 * 带认证的任意方法转发：401 时刷新一次并重试；仍失败则清 Cookie 并返回 401。
 * POST/PATCH 写操作由调用方保证 Origin 校验（见 auth/login 等路由）。
 */
export async function authorizedRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const { access } = await readAuthCookies();
  if (!access) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

  let upstream = await backendRequest(path, init, access);
  if (upstream.status === 401) {
    const pair = await refreshPair();
    if (!pair) {
      const res = NextResponse.json({ error: '登录已过期', code: 'UNAUTHORIZED' }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }
    upstream = await backendRequest(path, init, pair.accessToken);
    const body = await upstream.text();
    const res = new NextResponse(body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    });
    applyAuthCookies(res, pair);
    return res;
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}

/** 带认证的 GET。 */
export async function authorizedGet(path: string): Promise<NextResponse> {
  return authorizedRequest(path, { method: 'GET' });
}

/**
 * 可选认证转发：无 Cookie 时不带 Authorization 也不短路，
 * 由后端决定公开/受限（公告、活动等公开读模型使用）。
 */
export async function optionalAuthorizedRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const { access } = await readAuthCookies();
  let upstream = await backendRequest(path, init, access);
  if (upstream.status === 401 && access) {
    const pair = await refreshPair();
    if (pair) {
      upstream = await backendRequest(path, init, pair.accessToken);
      const body = await upstream.text();
      const res = new NextResponse(body, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
      });
      applyAuthCookies(res, pair);
      return res;
    }
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}

export { backendRequest, refreshPair };
