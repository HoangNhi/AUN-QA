import { useEffect, useState, type FC, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { GetPermissionByUser } from "@/types/system/role.types";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, getPermission } = useAuth();
  const [permission, setPermission] = useState<GetPermissionByUser | null>(
    null
  );
  const pathname = useLocation().pathname.split("/")[1];

  const getPermissionByPathname = async () => {
    const permission = await getPermission(pathname);
    if (permission) {
      setPermission(permission);
    }
  };

  useEffect(() => {
    getPermissionByPathname();
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission?.IsViewed === false) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
