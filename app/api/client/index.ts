// app/api/client/index.ts

/**
 * 前端 API 客户端入口
 * 
 * 统一导出所有 API 模块，提供便捷的访问方式。
 * 模块结构：
 * - core/     - 同源 BFF 请求原语（Cookie 身份，无 localStorage token）
 * - modules/  - 业务 API 模块（用户、RBAC、任务、宗门）
 */

export { userApi } from "./modules/user";
export { rbacApi } from "./modules/rbac";
export { taskApi } from "./modules/task";
export { sectApi } from "./modules/sect";
export { announcementApi } from "./modules/announcement";
export { eventApi } from "./modules/event";
export { financeApi } from "./modules/finance";
export { walletApi } from "./modules/wallet";
export type {
  WalletEntryRow,
  WalletRecipient,
  WalletTransferResult,
} from "./modules/wallet";