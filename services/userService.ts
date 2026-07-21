import { User, LoginCredentials, RegisterData } from "@/types/user";

export async function getCurrentUser(): Promise<User> {
  throw new Error("Mock service deprecated. Use userApi from @/app/api/client instead.");
}

export async function login(credentials: LoginCredentials): Promise<User> {
  throw new Error("Mock service deprecated. Use userApi from @/app/api/client instead.");
}

export async function register(data: RegisterData): Promise<User> {
  throw new Error("Mock service deprecated. Use userApi from @/app/api/client instead.");
}

export async function logout(): Promise<void> {
  throw new Error("Mock service deprecated. Use userApi from @/app/api/client instead.");
}
