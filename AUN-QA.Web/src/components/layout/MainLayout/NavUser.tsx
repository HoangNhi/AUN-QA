"use client";

import { ChevronsUpDown, KeyRound, LogOut, UserPen } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type {
  User,
  EditProfileRequest,
  ChangePasswordRequest,
} from "@/features/system/types/user.types";
import { useAuth } from "@/hooks/useAuth";
import { getFileUrl } from "@/lib/utils";
import { useState } from "react";
import PopupEditProfile from "./PopupEditProfile";
import PopupChangePassword from "./PopupChangePassword";
import { toast } from "sonner";
import { userService } from "@/features/system/api/user.api";

export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar();
  const { logout, refreshProfile } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSaveProfile = async (updatedUser: User) => {
    try {
      const response = await userService.editProfile({
        Fullname: updatedUser.Fullname,
        Email: updatedUser.Email,
        Avatar: updatedUser.Avatar,
        FolderUpload: updatedUser.FolderUpload,
      } as EditProfileRequest);

      if (response.Success) {
        toast.success("Cập nhật hồ sơ thành công");
        await refreshProfile();
        setIsEditProfileOpen(false);
      } else {
        toast.error(response.Message || "Cập nhật hồ sơ thất bại");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi cập nhật hồ sơ");
      console.error(error);
    }
  };

  const handleChangePassword = async (request: ChangePasswordRequest) => {
    try {
      const response = await userService.changePassword(request);
      if (response.Success) {
        toast.success("Đổi mật khẩu thành công");
        setIsChangePasswordOpen(false);
      } else {
        toast.error(response.Message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi đổi mật khẩu");
      console.error(error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={getFileUrl(user.Avatar)}
                  alt={user.Fullname}
                />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.Fullname}</span>
                <span className="truncate text-xs">{user.Email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={getFileUrl(user.Avatar)}
                    alt={user.Fullname}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.Fullname}</span>
                  <span className="truncate text-xs">{user.Email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}>
                <UserPen />
                Đổi hồ sơ cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                <KeyRound />
                Đổi mật khẩu
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {isEditProfileOpen && (
        <PopupEditProfile
          user={{ ...user, IsEdit: true }}
          isOpen={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          saveChange={handleSaveProfile}
        />
      )}
      {isChangePasswordOpen && (
        <PopupChangePassword
          isOpen={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
          saveChange={handleChangePassword}
        />
      )}
    </SidebarMenu>
  );
}
