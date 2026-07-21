# 后端连接文档

## 概述

本文档描述 fgs 计算机协会官网前端与后端 API 的连接规范、调用方法和数据格式。

## 目录结构

```
app/api/
├── client/
│   └── index.ts          # 统一的 API 客户端调用封装
└── README.md             # 本文档
```

## API 基础配置

- **基础路径**: `/api`
- **数据格式**: JSON (application/json)
- **字符编码**: UTF-8

## 通用请求封装

### request 函数

所有 API 请求通过统一的 `request<T>` 函数发送，自动处理：
- 请求头设置（Content-Type: application/json）
- 错误状态码抛出
- JSON 响应解析

```typescript
async function request<T>(endpoint: string, options?: RequestInit): Promise<T>
```

## API 模块划分

### 1. 用户认证模块 (userApi)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/user/me` | 获取当前登录用户信息 |
| POST | `/user/login` | 用户登录 |
| POST | `/user/register` | 用户注册 |
| POST | `/user/logout` | 用户退出登录 |

#### 用户数据结构 (User)

```typescript
interface User {
  id: string;
  username: string;
  studentId: string;
  avatar?: string;
  role: SectRole | null;       // 职位：宗主/大长老/太上长老/荣誉长老/长老/弟子/null
  peak: SectPeak | null;       // 所属峰：管理台/项目峰/算法峰/电路峰/null
  title: string | null;        // 称号
  lingshi: number;             // 灵石数量
  joinDate: string;            // 加入日期 (YYYY-MM-DD)
  isLoggedIn: boolean;         // 是否登录
  permissions: Permission[];   // 权限列表
}
```

#### 登录请求

```typescript
interface LoginCredentials {
  username: string;
  password: string;
}
```

#### 注册请求

```typescript
interface RegisterData {
  username: string;
  password: string;
  studentId: string;
}
```

### 2. 任务大厅模块 (taskApi)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/tasks` | 获取任务列表（支持筛选） |
| GET | `/tasks/:id` | 获取任务详情 |

#### 任务数据结构 (Task)

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: TaskDifficulty;  // 黑铁/青铜/白银/黄金
  status: TaskStatus;          // 审核中/等待中/讨伐中/已完成
  reward: number;              // 悬赏灵石数
  deadline: string;            // 截止日期 (YYYY-MM-DD)
  publisher: TaskPublisher;    // 发布者信息
  createdAt: string;           // 发布日期 (YYYY-MM-DD)
  techRequirements: string[];  // 技术需求列表
  completer?: TaskCompleter;   // 完成者（已完成任务有此字段）
}
```

#### 任务列表查询参数

```
GET /tasks?difficulty=黄金&status=等待中&keyword=首页
```

| 参数 | 类型 | 说明 |
|------|------|------|
| difficulty | string | 难度筛选：黑铁/青铜/白银/黄金（可选） |
| status | string | 状态筛选：审核中/等待中/讨伐中/已完成（可选） |
| keyword | string | 关键词搜索，匹配标题和描述（可选） |

### 3. 宗门事务模块 (sectApi)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/sect/current-user` | 获取当前用户的宗门信息 |
| GET | `/sect/disciples` | 获取弟子列表（支持按峰筛选） |
| GET | `/sect/disciples/management` | 获取管理层弟子列表 |
| GET | `/sect/disciples/search` | 搜索弟子 |
| GET | `/sect/peaks` | 获取所有山峰信息 |
| POST | `/sect/disciples` | 添加弟子 |
| PUT | `/sect/disciples/:id/move` | 移动弟子门派 |
| DELETE | `/sect/disciples/:id` | 删除弟子 |
| POST | `/sect/disciples/:id/reward` | 打赏弟子 |

#### 弟子数据结构 (Disciple)

```typescript
interface Disciple {
  id: string;
  name: string;
  studentId: string;
  role: SectRole;             // 角色
  peak: SectPeak;             // 所属峰
  avatar?: string;
  joinedAt: string;           // 加入日期
}
```

#### 山峰数据结构 (PeakInfo)

```typescript
interface PeakInfo {
  name: SectPeak;             // 山峰名称
  description: string;        // 描述
  leaderId?: string;          // 峰主ID
  memberCount: number;        // 成员数量
}
```

#### 权限类型 (Permission)

| 权限标识 | 说明 |
|----------|------|
| `manage_permissions` | 设置弟子权限 |
| `move_disciple` | 移动弟子门派 |
| `reward_disciple` | 打赏弟子 |
| `delete_disciple` | 删除弟子 |
| `add_disciple` | 添加弟子 |
| `manage_peaks` | 管理山峰（开辟新峰等） |

## 使用方法

### 引入 API 模块

```typescript
import { userApi, taskApi, sectApi } from "@/app/api/client";
```

### 示例：获取当前用户

```typescript
async function loadUser() {
  try {
    const user = await userApi.getCurrentUser();
    console.log("当前用户:", user);
  } catch (error) {
    console.error("获取用户信息失败:", error);
  }
}
```

### 示例：获取任务列表（带筛选）

```typescript
async function loadTasks() {
  const tasks = await taskApi.getTasks({
    difficulty: "黄金",
    status: "等待中",
    keyword: "首页",
  });
  return tasks;
}
```

### 示例：移动弟子门派

```typescript
async function moveDisciple(discipleId: string, newPeak: SectPeak) {
  const success = await sectApi.moveDisciplePeak(discipleId, newPeak);
  return success;
}
```

## 错误处理

所有 API 调用失败时会抛出 `Error` 对象，建议使用 try-catch 包裹：

```typescript
try {
  const result = await userApi.login({ username, password });
  // 成功处理
} catch (error) {
  console.error("登录失败:", error.message);
  // 错误处理（显示提示等）
}
```

## 当前状态说明

当前项目使用模拟数据（services 目录下的 mock 服务）进行前端开发。
接入真实后端时，只需将 `services/` 目录下的模拟服务替换为 `app/api/client/` 中的真实 API 调用即可。

### 迁移步骤

1. 确保后端 API 接口已就绪，接口规范遵循本文档
2. 将对应页面组件中从 `@/services/xxxService` 的导入改为从 `@/app/api/client` 导入
3. 调整函数调用方式（API 客户端返回 Promise，与模拟服务一致）
4. 测试各功能模块的数据连通性

### 模拟服务位置

- `services/userService.ts` — 用户认证模拟服务
- `services/taskService.ts` — 任务大厅模拟服务
- `services/sectService.ts` — 宗门事务模拟服务
- `data/mock*.ts` — 对应的模拟数据
