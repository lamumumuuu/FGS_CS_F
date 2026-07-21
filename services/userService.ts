import { User, LoginCredentials, RegisterData } from "@/types/user";

const mockLoggedInUser: User = {
  id: "2",
  username: "青云大长老",
  studentId: "20210002",
  role: "大长老",
  peak: "管理台",
  title: "执法长老",
  lingshi: 2580,
  joinDate: "2021-09-01",
  isLoggedIn: true,
  permissions: [
    "manage_permissions",
    "move_disciple",
    "reward_disciple",
    "delete_disciple",
    "add_disciple",
    "manage_peaks",
  ],
};

const mockGuestUser: User = {
  id: "",
  username: "",
  studentId: "",
  role: null,
  peak: null,
  title: null,
  lingshi: 0,
  joinDate: "",
  isLoggedIn: false,
  permissions: [],
};

let currentUser: User = { ...mockLoggedInUser };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCurrentUser(): Promise<User> {
  await delay(200);
  return { ...currentUser };
}

export async function login(credentials: LoginCredentials): Promise<User> {
  await delay(500);
  if (credentials.username && credentials.password) {
    currentUser = { ...mockLoggedInUser, username: credentials.username };
    return { ...currentUser };
  }
  throw new Error("用户名或密码错误");
}

export async function register(data: RegisterData): Promise<User> {
  await delay(500);
  if (data.username && data.password && data.studentId) {
    const newUser: User = {
      id: String(Date.now()),
      username: data.username,
      studentId: data.studentId,
      role: null,
      peak: null,
      title: null,
      lingshi: 100,
      joinDate: new Date().toISOString().split("T")[0],
      isLoggedIn: true,
      permissions: [],
    };
    currentUser = newUser;
    return { ...newUser };
  }
  throw new Error("注册信息不完整");
}

export async function logout(): Promise<void> {
  await delay(200);
  currentUser = { ...mockGuestUser };
}
