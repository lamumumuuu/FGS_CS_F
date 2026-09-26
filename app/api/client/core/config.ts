// app/api/client/core/config.ts

/**
 * 前端 API 客户端全局配置
 *
 * 后端 API 基址在此单点定义，避免在 request.ts / token.ts 中重复硬编码。
 */

/** 后端 API 基址（所有请求路径的前缀） */
export const API_BASE_URL = "http://localhost:8080/api";