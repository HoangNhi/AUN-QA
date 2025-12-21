import type { MenuGetListPaging } from "./menu.types";
import type { GetPermissionByUser } from "./role.types";
import type { SystemGroup } from "./systemGroup.types";
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
  systemGroup: SystemGroup[] | null;
  menu: MenuGetListPaging[] | null;
  permissions: GetPermissionByUser[] | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  getPermission: (pathname: string) => Promise<GetPermissionByUser | undefined>;
}