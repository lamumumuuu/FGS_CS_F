import { SectRole, SectPeak, Permission } from "./sect";

export interface User {
  id: string;
  username: string;
  studentId: string;
  avatar?: string;
  role: SectRole | null;
  peak: SectPeak | null;
  title: string | null;
  lingshi: number;
  joinDate: string;
  isLoggedIn: boolean;
  permissions: Permission[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  studentId: string;
}
