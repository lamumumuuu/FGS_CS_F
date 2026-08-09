// types/permissions.ts

/**
 * 权限常量定义
 * 所有后端权限 ID 在此集中声明，便于前后端对应和维护
 */

export const QUEST_PERMISSIONS = {
  VIEW_ALL: "quest:view_all",
  VIEW_OWN_PEAK: "quest:view_own_peak",
  PUBLISH_GLOBAL: "quest:publish_global",
  PUBLISH_PEAK: "quest:publish_peak",
  PUBLISH_DRAFT: "quest:publish_draft",
  REVIEW: "quest:review",
  EDIT_ANY: "quest:edit_any",
  EDIT_OWN_PEAK: "quest:edit_own_peak",
  DELETE_ANY: "quest:delete_any",
  DELETE_OWN_PEAK: "quest:delete_own_peak",
  ACCEPT: "quest:accept",
  SUBMIT: "quest:submit",
  REVIEW_RESULT: "quest:review_result",
  FORCE_CLOSE: "quest:force_close",
} as const;

export const MEMBER_PERMISSIONS = {
  VIEW_ALL: "member:view_all",
  VIEW_OWN_PEAK: "member:view_own_peak",
  APPROVE_JOIN: "member:approve_join",
  UPDATE_ROLE: "member:update_role",
  APPOINT_ELDER: "member:appoint_elder",
  EXPEL: "member:expel",
} as const;

export const AFFAIR_PERMISSIONS = {
  VIEW: "affair:view",
  ANNOUNCE_GLOBAL: "affair:announce_global",
  ANNOUNCE_PEAK: "affair:announce_peak",
  CREATE_EVENT: "affair:create_event",
  MANAGE_ALL_EVENTS: "affair:manage_all_events",
  MANAGE_OWN_PEAK: "affair:manage_own_peak",
} as const;

export const PEAK_PERMISSIONS = {
  VIEW: "peak:view",
  CREATE_DISBAND: "peak:create",
  EDIT_ANY: "peak:edit_any",
  EDIT_OWN: "peak:edit_own",
  MANAGE_MEMBERS: "peak:manage_members",
} as const;

export const FINANCE_PERMISSIONS = {
  VIEW_ALL: "finance:view_all",
  VIEW_OWN_PEAK: "finance:view_own_peak",
  ADJUST_LINGSHI: "finance:adjust_lingshi",
  SET_BASE: "finance:set_base",
} as const;

export const SYSTEM_PERMISSIONS = {
  ADMIN: "system:admin",
} as const;

/**
 * 权限分组描述
 * 用于前端展示权限说明
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // 任务大厅
  [QUEST_PERMISSIONS.VIEW_ALL]: "查看所有任务",
  [QUEST_PERMISSIONS.VIEW_OWN_PEAK]: "查看本峰任务",
  [QUEST_PERMISSIONS.PUBLISH_GLOBAL]: "发布全协会悬赏",
  [QUEST_PERMISSIONS.PUBLISH_PEAK]: "发布本峰悬赏",
  [QUEST_PERMISSIONS.PUBLISH_DRAFT]: "发布任务草稿",
  [QUEST_PERMISSIONS.EDIT_ANY]: "编辑任意任务",
  [QUEST_PERMISSIONS.EDIT_OWN_PEAK]: "编辑本峰任务",
  [QUEST_PERMISSIONS.DELETE_ANY]: "删除任意任务",
  [QUEST_PERMISSIONS.DELETE_OWN_PEAK]: "删除本峰任务",
  [QUEST_PERMISSIONS.ACCEPT]: "接取任务",
  [QUEST_PERMISSIONS.SUBMIT]: "提交任务",
  [QUEST_PERMISSIONS.REVIEW_RESULT]: "成果审核/验收任务",
  [QUEST_PERMISSIONS.FORCE_CLOSE]: "强制结项",

  // 成员管理
  [MEMBER_PERMISSIONS.VIEW_ALL]: "查看全协会成员",
  [MEMBER_PERMISSIONS.VIEW_OWN_PEAK]: "查看本峰成员",
  [MEMBER_PERMISSIONS.APPROVE_JOIN]: "审批入会申请",
  [MEMBER_PERMISSIONS.UPDATE_ROLE]: "修改成员角色",
  [MEMBER_PERMISSIONS.APPOINT_ELDER]: "任命/撤换长老",
  [MEMBER_PERMISSIONS.EXPEL]: "开除成员",

  // 宗门事务
  [AFFAIR_PERMISSIONS.ANNOUNCE_GLOBAL]: "发布宗门公告",
  [AFFAIR_PERMISSIONS.ANNOUNCE_PEAK]: "发布本峰公告",
  [AFFAIR_PERMISSIONS.CREATE_EVENT]: "创建活动",
  [AFFAIR_PERMISSIONS.MANAGE_ALL_EVENTS]: "管理所有活动",
  [AFFAIR_PERMISSIONS.MANAGE_OWN_PEAK]: "管理本峰活动",

  // 峰管理
  [PEAK_PERMISSIONS.CREATE_DISBAND]: "创建/解散峰",
  [PEAK_PERMISSIONS.EDIT_ANY]: "修改任意峰信息",
  [PEAK_PERMISSIONS.EDIT_OWN]: "修改本峰信息",
  [PEAK_PERMISSIONS.MANAGE_MEMBERS]: "峰成员管理",

  // 财务管理
  [FINANCE_PERMISSIONS.VIEW_ALL]: "查看全协会财务",
  [FINANCE_PERMISSIONS.VIEW_OWN_PEAK]: "查看本峰财务",
  [FINANCE_PERMISSIONS.ADJUST_LINGSHI]: "调整灵石",
  [FINANCE_PERMISSIONS.SET_BASE]: "设定悬赏基准",

  // 系统管理
  [SYSTEM_PERMISSIONS.ADMIN]: "系统管理（角色权限调整）",
};

/**
 * 权限分组
 * 用于权限管理页面展示
 */
export const PERMISSION_GROUPS = [
  {
    key: "quest",
    name: "任务大厅",
    permissions: [
      QUEST_PERMISSIONS.VIEW_ALL,
      QUEST_PERMISSIONS.VIEW_OWN_PEAK,
      QUEST_PERMISSIONS.PUBLISH_GLOBAL,
      QUEST_PERMISSIONS.PUBLISH_PEAK,
      QUEST_PERMISSIONS.PUBLISH_DRAFT,
      QUEST_PERMISSIONS.EDIT_ANY,
      QUEST_PERMISSIONS.EDIT_OWN_PEAK,
      QUEST_PERMISSIONS.DELETE_ANY,
      QUEST_PERMISSIONS.DELETE_OWN_PEAK,
      QUEST_PERMISSIONS.ACCEPT,
      QUEST_PERMISSIONS.SUBMIT,
      QUEST_PERMISSIONS.REVIEW_RESULT,
      QUEST_PERMISSIONS.FORCE_CLOSE,
    ],
  },
  {
    key: "member",
    name: "成员管理",
    permissions: [
      MEMBER_PERMISSIONS.VIEW_ALL,
      MEMBER_PERMISSIONS.VIEW_OWN_PEAK,
      MEMBER_PERMISSIONS.APPROVE_JOIN,
      MEMBER_PERMISSIONS.UPDATE_ROLE,
      MEMBER_PERMISSIONS.APPOINT_ELDER,
      MEMBER_PERMISSIONS.EXPEL,
    ],
  },
  {
    key: "affair",
    name: "宗门事务",
    permissions: [
      AFFAIR_PERMISSIONS.ANNOUNCE_GLOBAL,
      AFFAIR_PERMISSIONS.ANNOUNCE_PEAK,
      AFFAIR_PERMISSIONS.CREATE_EVENT,
      AFFAIR_PERMISSIONS.MANAGE_ALL_EVENTS,
      AFFAIR_PERMISSIONS.MANAGE_OWN_PEAK,
    ],
  },
  {
    key: "peak",
    name: "峰管理",
    permissions: [
      PEAK_PERMISSIONS.CREATE_DISBAND,
      PEAK_PERMISSIONS.EDIT_ANY,
      PEAK_PERMISSIONS.EDIT_OWN,
      PEAK_PERMISSIONS.MANAGE_MEMBERS,
    ],
  },
  {
    key: "finance",
    name: "财务管理",
    permissions: [
      FINANCE_PERMISSIONS.VIEW_ALL,
      FINANCE_PERMISSIONS.VIEW_OWN_PEAK,
      FINANCE_PERMISSIONS.ADJUST_LINGSHI,
      FINANCE_PERMISSIONS.SET_BASE,
    ],
  },
  {
    key: "system",
    name: "系统管理",
    permissions: [
      SYSTEM_PERMISSIONS.ADMIN,
    ],
  },
];
