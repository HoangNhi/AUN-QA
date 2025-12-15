import type { User } from "./user.types";

export interface LoginRequest {
    Username: string;
    Password: string;
}

export interface LoginResponse extends User {
    AccessToken: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}