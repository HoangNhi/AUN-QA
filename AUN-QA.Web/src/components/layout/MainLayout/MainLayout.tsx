import { AppSidebar } from "@/components/layout/MainLayout/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  permission?: GetPermissionByUser | null;
}

export default function MainLayout({ permission }: MainLayoutProps) {
  const location = useLocation();
  const pathname = location.pathname.replace("/", "");
  const { systemGroup, menu } = useAuth();
  // Find the current active item and its parent group
  let breadcrumbGroup = "";
  let breadcrumbPage = "";

  const activeItem = menu?.find((item) => item.Controller === pathname);
  if (activeItem) {
    breadcrumbGroup = systemGroup?.find(
      (group) => group.Id === activeItem.SystemGroupId
    )?.Name;
    breadcrumbPage = activeItem.Name;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbGroup && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        {breadcrumbGroup}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbPage || "Home"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet context={{ permission }} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
