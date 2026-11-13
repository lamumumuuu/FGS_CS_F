// app/api/client/modules/wallet.ts

/**
 * 钱包（灵石）API 模块 —— 统一账本契约。
 *
 * 读：/api/wallet/me（PermissionContext）、/api/wallet/me/entries（本人流水）
 * 写：/api/wallet/transfers（本人转账，服务端按登录身份扣款）
 *
 * BFF 为透传层，字段保持后端 snake_case；金额一律字符串，避免精度丢失。
 */

import { nativeRequest } from "../core/native";

export interface WalletRecipient {
  user_id: number;
  display_name?: string | null;
  username?: string | null;
}

export interface WalletEntryRow {
  id: number;
  transaction_id: number;
  account_id: number;
  delta: string;
  balance_after: string;
  entry_no: number;
  created_at?: string | null;
}

export interface WalletTransferResult {
  transaction_id: number;
  business_key: string;
  from_account_id: number;
  to_account_id: number;
  amount: string;
  created_at?: string | null;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const walletApi = {
  /** 本人最近流水（分录级，最多 100 条/页） */
  getMyEntries: async (limit = 20): Promise<WalletEntryRow[]> => {
    const body = await nativeRequest<{ items?: WalletEntryRow[] }>(
      `/api/wallet/me/entries?limit=${limit}`,
    );
    return body.items ?? [];
  },

  /** 搜索收款人（用户名/展示名前缀，至少 3 个字符） */
  searchRecipients: async (query: string): Promise<WalletRecipient[]> => {
    return nativeRequest<WalletRecipient[]>(
      `/api/wallet/recipients?q=${encodeURIComponent(query)}`,
    );
  },

  /** 本人转账：付款人由后端按登录身份决定，禁止传入 from */
  transfer: async (
    recipientUserId: number,
    amount: string,
    remark?: string,
  ): Promise<WalletTransferResult> => {
    return nativeRequest<WalletTransferResult>("/api/wallet/transfers", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: JSON.stringify({
        recipient_user_id: recipientUserId,
        amount,
        remark: remark || null,
      }),
    });
  },
};
