import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
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
import { authService } from "@/services/system/auth.service";
import { jwtDecode } from "jwt-decode";
import type { User } from "@/types/system/user.types";
import type { AuthContextType } from "@/types/system/auth.types";
import { toast } from "sonner";
import type { SystemGroup } from "@/types/system/systemGroup.types";
import type { GetPermissionByUser } from "@/types/system/role.types";
import { systemGroupService } from "@/services/system/systemGroup.service";
import { menuService } from "@/services/system/menu.service";
import { roleService } from "@/services/system/role.service";
import { userService } from "@/services/system/user.service";
import type { MenuGetListPaging } from "@/types/system/menu.types";
import { useLocation } from "react-router-dom";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
};

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

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (token) {
        try {
          const decoded: { [key: string]: any } = jwtDecode(token);
          const userJson = localStorage.getItem("user");

          if (decoded.exp * 1000 > Date.now()) {
            if (userJson) {
              setUser(JSON.parse(userJson));
            } else {
              const response = await userService.getById(
                decoded.name || decoded.Id || ""
              );
              if (response.Success) {
                setUser(response.Data);
                localStorage.setItem("user", JSON.stringify(response.Data));
              }
            }
            const systemGroupJson = localStorage.getItem("systemGroup");
            const menuJson = localStorage.getItem("menu");
            const permissionsJson = localStorage.getItem("permissions");
            if (systemGroupJson) {
              setSystemGroup(JSON.parse(systemGroupJson));
            } else {
              const response = await systemGroupService.getAll();
              if (response.Success) {
                setSystemGroup(response.Data || []);
                localStorage.setItem(
                  "systemGroup",
                  JSON.stringify(response.Data || [])
                );
              } else {
                throw new Error("Lỗi hệ thống");
              }
            }
            if (menuJson) {
              setMenu(JSON.parse(menuJson));
            } else {
              const response = await menuService.getListByUser(decoded.name);
              if (response.Success) {
                setMenu(response.Data || []);
                localStorage.setItem(
                  "menu",
                  JSON.stringify(response.Data || [])
                );
              } else {
                throw new Error("Lỗi hệ thống");
              }
            }
            if (permissionsJson) {
              setPermissions(JSON.parse(permissionsJson));
            } else {
              const response = await roleService.getPermissionsByUser(
                decoded.name
              );
              if (response.Success) {
                setPermissions(response.Data || []);
                localStorage.setItem(
                  "permissions",
                  JSON.stringify(response.Data || [])
                );
              } else {
                throw new Error("Lỗi hệ thống");
              }
            }
          } else {
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              //   const response = (await authService.refreshToken(
              //     refreshToken
              //   )) as any;
              //   const AccessToken =
              //     response.AccessToken || response.Token || response.accessToken;
              //   const NewRefreshToken =
              //     response.RefreshToken || response.refreshToken;
              //   const Id = response.Id || response.id;
              //   const Email = response.Email || response.email;
              //   const FullName = response.FullName || response.fullName;
              //   const Role = response.Role || response.role || "User";
              //   if (AccessToken) {
              //     saveTokens(AccessToken, NewRefreshToken);
              //     if (Id && Email) {
              //       const userData: User = { Id, Email, FullName, Role };
              //       setUser(userData);
              //       localStorage.setItem(
              //         STORAGE_KEYS.USER,
              //         JSON.stringify(userData)
              //       );
              //     }
              //   } else {
              //     throw new Error("Không nhận được AccessToken mới");
              //   }
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
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(
    async (username: string, password: string): Promise<any> => {
      try {
        setLoading(true);
        const response = await authService.login({
          Username: username,
          Password: password,
        });

        if (!response.Success) {
          throw new Error(response.Message);
        }

        const AccessToken = response.Data?.AccessToken;
        // const RefreshToken = response.Data?.RefreshToken;
        const Id = response.Data?.Id;
        const Fullname = response.Data?.Fullname;
        const Username = response.Data?.Username;

        if (!AccessToken)
          throw new Error("Phản hồi từ server không chứa AccessToken");

        saveTokens(AccessToken, "");
        const userData: User = {
          Id: Id,
          Fullname: Fullname,
          Username: Username,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return response;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Đăng nhập thất bại");
      } finally {
        setLoading(false);
      }
    },
    []
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
        const response = await menuService.getListByUser(user?.Id);
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
        const response = await roleService.getPermissionsByUser(user?.Id);
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
    login,
    logout,
    getPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
