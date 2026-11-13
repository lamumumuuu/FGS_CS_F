/**
 * @file 旧端任务/团队 BFF 通用转发：Cookie 身份 + Idempotency-Key 注入。
 */

import { authorizedRequest, optionalAuthorizedRequest } from './backend';

type RouteContext = { params: Promise<{ path?: string[] }> };

/** 仅允许已声明的原生任务/团队端点，避免开放 catch-all 变成任意后端代理。 */
const ALLOWED_ROUTES: Record<string, Array<{ method: string; pattern: RegExp }>> = {
  '/tasks': [
    { method: 'GET', pattern: /^\/tasks$/ },
    { method: 'POST', pattern: /^\/tasks$/ },
    { method: 'GET', pattern: /^\/tasks\/me\/published$/ },
    { method: 'GET', pattern: /^\/tasks\/me\/claims$/ },
    { method: 'GET', pattern: /^\/tasks\/\d+$/ },
    { method: 'PATCH', pattern: /^\/tasks\/\d+$/ },
    { method: 'DELETE', pattern: /^\/tasks\/\d+$/ },
    { method: 'POST', pattern: /^\/tasks\/\d+\/review-requests$/ },
    { method: 'GET', pattern: /^\/tasks\/\d+\/claims$/ },
    { method: 'POST', pattern: /^\/tasks\/\d+\/claims$/ },
    { method: 'GET', pattern: /^\/tasks\/\d+\/history$/ },
    { method: 'POST', pattern: /^\/task-claims\/\d+\/cancel$/ },
    { method: 'POST', pattern: /^\/task-claims\/\d+\/submissions$/ },
  ],
  '/teams': [
    { method: 'GET', pattern: /^\/teams$/ },
    { method: 'POST', pattern: /^\/teams$/ },
    { method: 'GET', pattern: /^\/teams\/invitations\/me$/ },
    { method: 'POST', pattern: /^\/teams\/invitations\/\d+\/(accept|reject)$/ },
    { method: 'GET', pattern: /^\/teams\/\d+$/ },
    { method: 'PATCH', pattern: /^\/teams\/\d+$/ },
    { method: 'POST', pattern: /^\/teams\/\d+\/invitations$/ },
    { method: 'POST', pattern: /^\/teams\/\d+\/leave$/ },
  ],
  '/admin/tasks': [
    { method: 'GET', pattern: /^\/admin\/tasks$/ },
    { method: 'POST', pattern: /^\/admin\/tasks\/\d+\/reviews$/ },
    { method: 'POST', pattern: /^\/admin\/tasks\/\d+\/force-close$/ },
  ],
  '/admin/task-submissions': [
    { method: 'POST', pattern: /^\/admin\/task-submissions\/\d+\/reviews$/ },
  ],
  '/events': [
    { method: 'GET', pattern: /^\/events$/ },
    { method: 'GET', pattern: /^\/events\/me\/registered$/ },
    { method: 'GET', pattern: /^\/events\/\d+$/ },
    { method: 'POST', pattern: /^\/events\/\d+\/register$/ },
    { method: 'DELETE', pattern: /^\/events\/\d+\/register$/ },
  ],
  '/admin/events': [
    { method: 'GET', pattern: /^\/admin\/events$/ },
    { method: 'POST', pattern: /^\/admin\/events$/ },
    { method: 'PUT', pattern: /^\/admin\/events\/\d+$/ },
    { method: 'DELETE', pattern: /^\/admin\/events\/\d+$/ },
    { method: 'POST', pattern: /^\/admin\/events\/\d+\/(close|cancel)$/ },
  ],
  '/announcements': [
    { method: 'GET', pattern: /^\/announcements$/ },
    { method: 'GET', pattern: /^\/announcements\/admin$/ },
    { method: 'GET', pattern: /^\/announcements\/admin\/\d+$/ },
    { method: 'POST', pattern: /^\/announcements\/admin$/ },
    { method: 'PATCH', pattern: /^\/announcements\/admin\/\d+$/ },
    { method: 'DELETE', pattern: /^\/announcements\/admin\/\d+$/ },
    { method: 'POST', pattern: /^\/announcements\/admin\/\d+\/(publish|archive|toggle)$/ },
  ],
  // 财务管理：读模型 + 发行/调拨/峰间调拨（finance:* + 后端范围校验）
  '/admin/finance': [
    { method: 'GET', pattern: /^\/admin\/finance\/(treasury|stats|transactions)$/ },
    { method: 'GET', pattern: /^\/admin\/finance\/peaks$/ },
    { method: 'GET', pattern: /^\/admin\/finance\/peaks\/\d+$/ },
    { method: 'GET', pattern: /^\/admin\/finance\/peaks\/\d+\/members$/ },
    { method: 'GET', pattern: /^\/admin\/finance\/users\/\d+$/ },
    { method: 'POST', pattern: /^\/admin\/finance\/(adjustments|allocations|peak-transfers)$/ },
  ],
  // 统一授权：角色列表/权限点/整组替换（role:* / permission:*）
  '/admin/roles': [
    { method: 'GET', pattern: /^\/admin\/roles$/ },
    { method: 'POST', pattern: /^\/admin\/roles$/ },
    { method: 'PATCH', pattern: /^\/admin\/roles\/\d+$/ },
    { method: 'DELETE', pattern: /^\/admin\/roles\/\d+$/ },
    { method: 'PUT', pattern: /^\/admin\/roles\/\d+\/permissions$/ },
  ],
  '/admin/permissions': [{ method: 'GET', pattern: /^\/admin\/permissions$/ }],
  // 组织管理：成员与峰（member:* / peak:* + 后端 scope 校验）
  '/admin/organization': [
    { method: 'GET', pattern: /^\/admin\/organization\/history$/ },
    { method: 'GET', pattern: /^\/admin\/organization\/members\/\d+\/history$/ },
    { method: 'POST', pattern: /^\/admin\/organization\/members$/ },
    { method: 'PATCH', pattern: /^\/admin\/organization\/members\/\d+$/ },
    { method: 'POST', pattern: /^\/admin\/organization\/members\/\d+\/(move|remove)$/ },
    { method: 'POST', pattern: /^\/admin\/organization\/peaks$/ },
    { method: 'PATCH', pattern: /^\/admin\/organization\/peaks\/\d+$/ },
    { method: 'POST', pattern: /^\/admin\/organization\/peaks\/\d+\/archive$/ },
  ],
};

function isAllowed(basePath: string, fullPath: string, method: string): boolean {
  return (ALLOWED_ROUTES[basePath] ?? []).some(
    (route) => route.method === method && route.pattern.test(fullPath),
  );
}

function newIdempotencyKey(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

function snakeizeDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => snakeizeDeep(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        toSnakeKey(k),
        snakeizeDeep(v),
      ]),
    );
  }
  return value;
}

export async function forwardAuthorized(
  req: Request,
  { params }: RouteContext,
  method: string,
  basePath: string,
  options: { optionalAuth?: boolean } = {},
) {
  const { path = [] } = await params;
  const url = new URL(req.url);
  const suffix = path.length
    ? `/${path.map((segment) => encodeURIComponent(segment)).join('/')}`
    : '';
  const backendPath = `${basePath}${suffix}`;
  if (!isAllowed(basePath, backendPath, method)) {
    return new Response(JSON.stringify({ error: '不允许的接口路径', code: 'BFF_PATH_FORBIDDEN' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const backendPathWithQuery = `${backendPath}${url.search}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const ifMatch = req.headers.get('If-Match');
  if (ifMatch) headers['If-Match'] = ifMatch;
  if (method !== 'GET') {
    headers['Idempotency-Key'] =
      req.headers.get('Idempotency-Key') ?? newIdempotencyKey();
  }

  let body: string | undefined;
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    const raw = await req.text();
    if (raw.trim()) {
      try {
        body = JSON.stringify(snakeizeDeep(JSON.parse(raw)));
      } catch {
        body = raw;
      }
    }
  }

  const forward = options.optionalAuth ? optionalAuthorizedRequest : authorizedRequest;
  return forward(backendPathWithQuery, { method, body, headers });
}
