import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const pathname = location.pathname;
  const { systemGroup, menu } = useAuth();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">AUN-QA</span>
                  <span className="">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link className="font-medium" to="/">
                  Trang chủ
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {systemGroup?.map((group) => {
              const groupMenu = menu?.filter(
                (item) => item.SystemGroupId === group.Id
              );

              if (!groupMenu?.length) return null;

              return (
                <SidebarMenuItem key={group.Id}>
                  <SidebarMenuButton asChild>
                    <a className="font-medium">{group.Name}</a>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {groupMenu.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.Id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.Controller}
                        >
                          <Link to={subItem.Controller}>{subItem.Name}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
