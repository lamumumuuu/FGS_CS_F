// types/permissions.ts

/**
 * 权限常量定义（统一后端原生权限名）
 *
 * 常量键沿用旧页面命名以减少改动，值已切换为 FastAPI RBAC 的统一权限名，
 * 不再依赖 Java quest:* / affair:* 字面量。
 */

export const QUEST_PERMISSIONS = {
  VIEW_ALL: "task:read",
  VIEW_OWN_PEAK: "task:read",
  PUBLISH_GLOBAL: "task:create",
  PUBLISH_PEAK: "task:create",
  PUBLISH_DRAFT: "task:publish",
  REVIEW: "task:review",
  EDIT_ANY: "task:update",
  EDIT_OWN_PEAK: "task:update",
  DELETE_ANY: "task:delete",
  DELETE_OWN_PEAK: "task:delete",
  ACCEPT: "task:claim",
  SUBMIT: "task:submit",
  REVIEW_RESULT: "task:accept",
  FORCE_CLOSE: "task:close",
} as const;

export const MEMBER_PERMISSIONS = {
  VIEW_ALL: "member:read",
  VIEW_OWN_PEAK: "member:read",
  APPROVE_JOIN: "member:approve",
  UPDATE_ROLE: "member:update",
  APPOINT_ELDER: "member:update",
  EXPEL: "member:remove",
} as const;

export const AFFAIR_PERMISSIONS = {
  VIEW: "announcement:read",
  ANNOUNCE_GLOBAL: "announcement:create",
  ANNOUNCE_PEAK: "announcement:create",
  CREATE_EVENT: "event:create",
  MANAGE_ALL_EVENTS: "event:update",
  MANAGE_OWN_PEAK: "event:update",
} as const;

export const PEAK_PERMISSIONS = {
  VIEW: "peak:read",
  CREATE_DISBAND: "peak:create",
  EDIT_ANY: "peak:update",
  EDIT_OWN: "peak:update",
  MANAGE_MEMBERS: "member:move",
} as const;

export const FINANCE_PERMISSIONS = {
  VIEW_ALL: "finance:read",
  VIEW_OWN_PEAK: "finance:read",
  ADJUST_LINGSHI: "finance:adjust",
} as const;

export const SYSTEM_PERMISSIONS = {
  ADMIN: "role:manage_permissions",
} as const;

/** 权限说明（按统一后端权限名去重） */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "task:read": "查看任务",
  "task:create": "创建任务",
  "task:update": "编辑任务",
  "task:delete": "归档任务",
  "task:publish": "申请上架",
  "task:claim": "接取任务",
  "task:submit": "提交成果",
  "task:review": "上架审核",
  "task:accept": "成果验收",
  "task:close": "强制结项",

  "member:read": "查看成员",
  "member:approve": "审批入会",
  "member:update": "修改成员资料/归属",
  "member:remove": "成员离会",

  "announcement:read": "查看公告",
  "announcement:create": "创建公告",
  "event:create": "创建活动",
  "event:update": "编辑活动",

  "peak:read": "查看峰",
  "peak:create": "创建峰",
  "peak:update": "编辑峰",

  "finance:read": "查看财务",
  "finance:adjust": "发行/回收",

  "role:manage_permissions": "角色权限管理",
};

/** 权限分组（统一权限名，供管理页展示） */
export const PERMISSION_GROUPS = [
  {
    key: "task",
    name: "任务",
    permissions: [
      "task:read",
      "task:create",
      "task:update",
      "task:delete",
      "task:publish",
      "task:claim",
      "task:submit",
      "task:review",
      "task:accept",
      "task:close",
    ],
  },
  {
    key: "member",
    name: "成员",
    permissions: ["member:read", "member:approve", "member:update", "member:remove"],
  },
  {
    key: "content",
    name: "公告与活动",
    permissions: [
      "announcement:read",
      "announcement:create",
      "announcement:update",
      "announcement:delete",
      "announcement:publish",
      "announcement:archive",
      "event:read",
      "event:create",
      "event:update",
      "event:delete",
      "event:publish",
      "event:close",
      "event:manage_registration",
    ],
  },
  {
    key: "organization",
    name: "组织",
    permissions: ["peak:read", "peak:create", "peak:update", "peak:archive"],
  },
  {
    key: "finance",
    name: "财务",
    permissions: [
      "finance:read",
      "finance:allocate",
      "finance:transfer",
      "finance:adjust",
      "finance:reconcile",
    ],
  },
  {
    key: "system",
    name: "系统",
    permissions: ["role:manage_permissions", "audit:read"],
  },
];
