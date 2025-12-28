import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleService } from "@/features/system/api/role.api";
import type { ModelCombobox } from "@/types/base/base.types";
import type { User } from "@/features/system/types/user.types";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupDetail = ({
  user,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (user: User, isAddMore: boolean) => void;
}) => {
  const [id] = useState<string | null>(user?.Id || uuidv4());
  const [username, setUsername] = useState(user?.Username || "");
  const [password, setPassword] = useState(user?.Password || "b86e09fa-0751");
  const [fullName, setFullName] = useState(user?.Fullname || "");
  const [roleId, setRoleId] = useState(user?.RoleId || "");
  const [roles, setRoles] = useState<ModelCombobox[]>([]);
  const [isActived, setIsActived] = useState<boolean>(user?.IsActived ?? true);

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id ?? uuidv4(),
        Username: username,
        Password: password,
        Fullname: fullName,
        RoleId: roleId,
        IsEdit: user?.IsEdit || false,
        IsActived: isActived,
      },
      isAddMore
    );
  };

  useEffect(() => {
    const fetchRoles = async () => {
      const res = await roleService.getAllCombobox();
      if (res?.Success && res.Data) {
        setRoles(res.Data || []);
      }
    };
    fetchRoles();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {user?.IsEdit ? "Cập nhật Tài khoản" : "Thêm mới Tài khoản"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label>Tên đăng nhập</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label>Mật khẩu</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label>Họ và tên</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label>Vai trò</Label>
              <Select
                value={roleId || "no-value"}
                onValueChange={(value) =>
                  setRoleId(value === "no-value" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="no-value">Chọn vai trò</SelectItem>
                    {roles.map((item) => (
                      <SelectItem key={item.Value} value={item.Value || ""}>
                        {item.Text}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Trạng thái</Label>
              <Select
                value={isActived ? "true" : "false"}
                onValueChange={(value) =>
                  setIsActived(value === "true" ? true : false)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Không hoạt động</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
            {!user?.IsEdit && (
              <Button type="button" onClick={() => onSubmit(true)}>
                Lưu và thêm tiếp
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupDetail;
