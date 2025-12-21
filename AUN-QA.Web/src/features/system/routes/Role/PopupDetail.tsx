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

import type { Role } from "@/features/system/types/role.types";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupDetail = ({
  data,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  data: Role | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (data: Role, isAddMore: boolean) => void;
}) => {
  const [id] = useState<string>(data?.Id || uuidv4());
  const [name, setName] = useState(data?.Name || "");

  const onSubmit = (isAddMore: boolean) => {
    if (!name) {
      // Simple validation or toast
      return;
    }
    saveChange(
      {
        Id: id,
        Name: name,
        IsEdit: data?.IsEdit || false,
        CreatedAt: data?.CreatedAt || "",
        UpdatedAt: data?.UpdatedAt || "",
      },
      isAddMore
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
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
              {data?.IsEdit ? "Cập nhật vai trò" : "Thêm mới vai trò"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên gọi
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
            {!data?.IsEdit && (
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
