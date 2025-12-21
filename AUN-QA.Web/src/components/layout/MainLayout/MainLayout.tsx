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
import { data } from "./nav-data";
import type { GetPermissionByUser } from "@/types/system/role.types";

interface MainLayoutProps {
  permission?: GetPermissionByUser | null;
}

export default function MainLayout({ permission }: MainLayoutProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Find the current active item and its parent group
  let breadcrumbGroup = "";
  let breadcrumbPage = "";

  for (const group of data.navMain) {
    if (group.items) {
      const activeItem = group.items.find((item) => item.url === pathname);
      if (activeItem) {
        breadcrumbGroup = group.title;
        breadcrumbPage = activeItem.title;
        break;
      }
    }
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
