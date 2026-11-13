// app/api/client/core/native.ts

/**
 * 旧端同源 BFF 请求原语：Cookie 身份、JSON 解析、真实错误消息。
 * 不读取 localStorage token，不再拼 Java 8081 地址。
 */

export async function nativeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  if (!res.ok) {
    throw new Error(
      (body?.message as string | undefined) ??
        (body?.error as string | undefined) ??
        `请求失败 (${res.status})`,
    );
  }
  return body as T;
}
