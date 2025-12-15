import { Button } from "@/components/ui/button";
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
import { roleService } from "@/services/system/role.service";
import type { ModelCombobox } from "@/types/base/base.types";
import type { User } from "@/types/system/user.types";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupDetail = ({
  user,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (user: User, isAddMore: boolean) => void;
}) => {
  const [id, setId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<ModelCombobox[]>([]);

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id,
        Username: username,
        Password: password,
        Fullname: fullName,
        RoleId: roleId,
        IsEdit: user?.IsEdit || false,
      },
      isAddMore
    );
  };

  useEffect(() => {
    const fetchRoles = async () => {
      // Fetch all system groups for dropdown (page index 1, large page size)
      const res = await roleService.getAllCombobox();
      if (res?.Success && res.Data) {
        setRoles(res.Data);
      }
    };

    if (isOpen) {
      fetchRoles();
    }

    if (user?.Id) {
      setId(user.Id);
      setUsername(user.Username);
      setPassword(user.Password);
      setFullName(user.Fullname);
      setRoleId(user.RoleId);
    } else {
      setId(uuidv4());
      setUsername("");
      setPassword("");
      setFullName("");
      setRoleId("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
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
          <div className="grid gap-4">
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
                      <SelectItem key={item.Value} value={item.Value}>
                        {item.Text}
                      </SelectItem>
                    ))}
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
