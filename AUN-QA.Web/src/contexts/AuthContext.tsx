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
import { authService } from "@/services/identity/auth.service";
import { jwtDecode } from "jwt-decode";
import type { User } from "@/types/identity/user.types";
import type { AuthContextType } from "@/types/identity/auth.types";

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
  const [error, setError] = useState<string | null>(null);

  const performLogout = async () => {
    setUser(null);
    clearTokens();
    localStorage.removeItem("user");
  };

  const initAuth = useCallback(async () => {
    // BẮT ĐẦU TRY-FINALLY ĐỂ ĐẢM BẢO LOADING LUÔN TẮT
    try {
      const token = getAccessToken();

      if (token) {
        try {
          const decoded: { [key: string]: any } = jwtDecode(token);

          if (decoded.exp * 1000 > Date.now()) {
            const userJson = localStorage.getItem(STORAGE_KEYS.USER);
            if (userJson) {
              setUser(JSON.parse(userJson));
            } else {
              setUser({
                Id: decoded.sub || decoded.Id || "",
                Email: decoded.email || decoded.Email || "",
                FullName:
                  decoded.name ||
                  decoded.unique_name ||
                  decoded.FullName ||
                  "User",
                Role: decoded.role || decoded.Role || "User",
              });
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
    } catch (err: any) {
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
        setError(null);
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
        const errorMessage =
          err instanceof Error ? err.message : "Đăng nhập thất bại";
        setError(errorMessage);
        throw err;
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
      setError(err instanceof Error ? err.message : "Đăng xuất thất bại");
      await performLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
