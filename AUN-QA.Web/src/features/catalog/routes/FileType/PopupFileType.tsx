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
import type { FileType } from "@/features/catalog/types/filetype.types";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupFileType = ({
  fileType,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  fileType: FileType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (fileType: FileType, isAddMore: boolean) => void;
}) => {
  const [id] = useState<string | null>(fileType?.Id || uuidv4());
  const [code, setCode] = useState(fileType?.Code || "");
  const [name, setName] = useState(fileType?.Name || "");
  const [isActived, setIsActived] = useState<boolean>(
    fileType?.IsActived ?? true
  );

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id || uuidv4(),
        Code: code,
        Name: name,
        IsEdit: fileType?.IsEdit || false,
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
              {fileType?.IsEdit ? "Cập nhật Loại File" : "Thêm mới Loại File"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3">
              <Label>Mã loại file</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="grid gap-3">
              <Label>Tên loại file</Label>
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
            {!fileType?.IsEdit && (
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

export default PopupFileType;
