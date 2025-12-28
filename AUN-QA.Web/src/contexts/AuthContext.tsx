import {
  type FC,
  type ReactNode,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  saveTokens,
  getAccessToken,
  clearTokens,
  getRefreshToken,
} from "@/lib/cookies";
import { authService } from "@/features/system/api/auth.api";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import type { User } from "@/features/system/types/user.types";
import type {
  AuthContextType,
  LoginResponse,
} from "@/features/system/types/auth.types";
import { toast } from "sonner";
import type { ApiResponse } from "@/lib/api";
import type { SystemGroup } from "@/features/system/types/systemGroup.types";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { systemGroupService } from "@/features/system/api/systemGroup.api";
import { menuService } from "@/features/system/api/menu.api";
import { roleService } from "@/features/system/api/role.api";
import { userService } from "@/features/system/api/user.api";
import type { MenuGetListPaging } from "@/features/system/types/menu.types";
// import { useLocation } from "react-router-dom";

import { AuthContext } from "./auth-context-definition";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [systemGroup, setSystemGroup] = useState<SystemGroup[]>([]);
  const [menu, setMenu] = useState<MenuGetListPaging[]>([]);
  const [permissions, setPermissions] = useState<GetPermissionByUser[]>([]);

  const performLogout = async () => {
    setUser(null);
    setSystemGroup([]);
    setMenu([]);
    setPermissions([]);
    clearTokens();
    localStorage.removeItem("user");
  };

  const fetchUserData = useCallback(async (currentUser: User) => {
    let currentSystemGroup: SystemGroup[] = [];
    let currentMenu: MenuGetListPaging[] = [];
    let currentPermissions: GetPermissionByUser[] = [];

    // 1. Ensure System Group is available
    const systemGroupJson = localStorage.getItem("systemGroup");
    if (systemGroupJson) {
      try {
        currentSystemGroup = JSON.parse(systemGroupJson);
      } catch (e) {
        console.error("Error parsing systemGroup", e);
      }
    }

    if (!currentSystemGroup || currentSystemGroup.length === 0) {
      const response = await systemGroupService.getAll();
      if (response.Success) {
        currentSystemGroup = response.Data || [];
        localStorage.setItem("systemGroup", JSON.stringify(currentSystemGroup));
      }
    }
    setSystemGroup(currentSystemGroup || []);

    // 2. Ensure Menu is available
    const menuJson = localStorage.getItem("menu");
    if (menuJson) {
      try {
        currentMenu = JSON.parse(menuJson);
      } catch (e) {
        console.error("Error parsing menu", e);
      }
    }

    if (!currentMenu || currentMenu.length === 0) {
      const response = await menuService.getListByUser(currentUser.Id);
      if (response.Success) {
        currentMenu = response.Data || [];
        localStorage.setItem("menu", JSON.stringify(currentMenu));
      }
    }
    setMenu(currentMenu || []);

    // 3. Ensure Permissions are available
    const permissionsJson = localStorage.getItem("permissions");
    if (permissionsJson) {
      try {
        currentPermissions = JSON.parse(permissionsJson);
      } catch (e) {
        console.error("Error parsing permissions", e);
      }
    }

    if (!currentPermissions || currentPermissions.length === 0) {
      const response = await roleService.getPermissionsByUser(currentUser.Id);
      if (response.Success) {
        currentPermissions = response.Data || [];
        localStorage.setItem("permissions", JSON.stringify(currentPermissions));
      }
    }
    setPermissions(currentPermissions || []);
  }, []);

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const userJson = localStorage.getItem("user");
          let currentUser: User | null = null;
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            if (userJson) {
              const userData = JSON.parse(userJson);
              setUser(userData);
              currentUser = userData;
            } else {
              const response = await userService.getCurrentUser();
              if (response.Success) {
                setUser(response.Data || null);
                localStorage.setItem("user", JSON.stringify(response.Data));
                currentUser = response.Data || null;
              }
            }

            if (currentUser) {
              await fetchUserData(currentUser);
            }
          } else {
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              // Implementation for refresh token if needed
            } else {
              await performLogout();
            }
          }
        } catch (e) {
          console.error("Lỗi xác thực token:", e);
          await performLogout();
        }
      } else {
        await performLogout();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng nhập thất bại");
      await performLogout();
    } finally {
      setLoading(false);
    }
  }, [fetchUserData]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<ApiResponse<LoginResponse>> => {
      try {
        setLoading(true);
        const response = await authService.login({
          Username: username,
          Password: password,
        });

        if (!response.Success) {
          // We still return response so the caller can check Success/Message
          return response;
        }

        const AccessToken = response.Data?.AccessToken;
        // const RefreshToken = response.Data?.RefreshToken;
        const Id = response.Data?.Id;
        const Fullname = response.Data?.Fullname;
        const Username = response.Data?.Username;

        if (!AccessToken) {
          return {
            ...response,
            Success: false,
            Message: "Phản hồi từ server không chứa AccessToken",
          };
        }

        saveTokens(AccessToken, "");
        const RoleId = response.Data?.RoleId;
        const userData: User = {
          Id: Id || "",
          Fullname: Fullname || "",
          Username: Username || "",
          RoleId: RoleId || "",
          IsEdit: false,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        // Fetch user data immediately after login
        await fetchUserData(userData);

        return response;
      } catch (err: unknown) {
        return {
          Success: false,
          Message: err instanceof Error ? err.message : "Đăng nhập thất bại",
          StatusCode: 500,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchUserData]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await performLogout();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng xuất thất bại");
    } finally {
      setLoading(false);
    }
  }, []);

  const getPermission = async (
    pathname: string
  ): Promise<GetPermissionByUser | undefined> => {
    // setLoading(true); // Don't block UI for this check? keeping inconsistent with original for now but might remove later

    if (pathname === "") {
      return {
        Controller: "Home",
        IsViewed: true,
        IsAdded: true,
        IsUpdated: true,
        IsDeleted: true,
        IsApproved: true,
        IsAnalyzed: true,
      };
    }

    let currentSystemGroup = systemGroup;
    let currentMenu = menu;
    let currentPermissions = permissions;

    // 1. Ensure System Group is available
    if (!currentSystemGroup || currentSystemGroup.length === 0) {
      const systemGroupJson = localStorage.getItem("systemGroup");
      if (systemGroupJson) {
        try {
          currentSystemGroup = JSON.parse(systemGroupJson);
          setSystemGroup(currentSystemGroup || []);
        } catch (e) {
          console.error("Error parsing systemGroup", e);
        }
      }

      // If still empty (e.g. not in method storage), try API
      if (!currentSystemGroup || currentSystemGroup.length === 0) {
        const response = await systemGroupService.getAll();
        if (response.Success) {
          currentSystemGroup = response.Data || [];
          setSystemGroup(currentSystemGroup);
          localStorage.setItem(
            "systemGroup",
            JSON.stringify(currentSystemGroup)
          );
        }
      }
    }

    // 2. Ensure Menu is available
    if (!currentMenu || currentMenu.length === 0) {
      const menuJson = localStorage.getItem("menu");
      if (menuJson) {
        try {
          currentMenu = JSON.parse(menuJson);
          setMenu(currentMenu || []);
        } catch (e) {
          console.error("Error parsing menu", e);
        }
      }

      if (!currentMenu || currentMenu.length === 0) {
        const response = await menuService.getListByUser(user?.Id || "");
        if (response.Success) {
          currentMenu = response.Data || [];
          setMenu(currentMenu);
          localStorage.setItem("menu", JSON.stringify(currentMenu));
        }
      }
    }

    // 3. Ensure Permissions are available
    if (!currentPermissions || currentPermissions.length === 0) {
      const permissionsJson = localStorage.getItem("permissions");
      if (permissionsJson) {
        try {
          currentPermissions = JSON.parse(permissionsJson);
          setPermissions(currentPermissions || []);
        } catch (e) {
          console.error("Error parsing permissions", e);
        }
      }

      if (!currentPermissions || currentPermissions.length === 0) {
        // Fallback to API. user.Id might be undefined if initAuth hasn't finished user load
        // But we rely on localStorage primarily for reload persistence.
        const response = await roleService.getPermissionsByUser(user?.Id || "");
        if (response.Success) {
          currentPermissions = response.Data || [];
          setPermissions(currentPermissions);
          localStorage.setItem(
            "permissions",
            JSON.stringify(currentPermissions)
          );
        }
      }
    }

    const result = currentPermissions?.find(
      (item) => item.Controller === pathname
    );
    return result;
  };

  const value: AuthContextType = {
    user,
    systemGroup,
    menu,
    permissions,
    isAuthenticated: !!user,
    loading,
    error: null,
    login,
    logout,
    getPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
