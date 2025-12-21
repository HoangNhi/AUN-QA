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
import type { Faculty } from "@/features/catalog/types/faculty.types";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupFaculty = ({
  faculty,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  faculty: Faculty | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (faculty: Faculty, isAddMore: boolean) => void;
}) => {
  const [id] = useState<string | null>(faculty?.Id || uuidv4());
  const [name, setName] = useState(faculty?.Name || "");
  const [isActived, setIsActived] = useState<boolean>(
    faculty?.IsActived ?? true
  );

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id || uuidv4(),
        Name: name,
        IsEdit: faculty?.IsEdit || false,
        IsActived: isActived,
      },
      isAddMore
    );
  };

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
              {faculty?.IsEdit ? "Cập nhật Khoa" : "Thêm mới Khoa"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3">
              <Label>Tên khoa</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
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
            {!faculty?.IsEdit && (
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

export default PopupFaculty;
