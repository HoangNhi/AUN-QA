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
import type { User } from "@/types/identity/user.types";
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

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id,
        Username: username,
        Password: password,
        Fullname: fullName,
        IsEdit: user?.IsEdit || false,
      },
      isAddMore
    );
  };

  useEffect(() => {
    if (user?.Id) {
      setId(user.Id);
      setUsername(user.Username);
      setPassword("Abc@123");
      setFullName(user.Fullname);
    } else {
      setId(uuidv4());
      setUsername("");
      setPassword("");
      setFullName("");
    }
  }, [user]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <form onSubmit={(e) => onSubmit(false)}>
        <DialogContent
          className="sm:max-w-[425px]"
          onPointerDownOutside={(e) => e.preventDefault()}
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
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button>Lưu</Button>
            <Button type="button" onClick={() => onSubmit(true)}>
              Lưu và thêm tiếp
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default PopupDetail;
