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
import { useState, useEffect } from "react";
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
  const [id, setId] = useState<string>(fileType?.Id || uuidv4());
  const [code, setCode] = useState<string>(fileType?.Code || "");
  const [name, setName] = useState<string>(fileType?.Name || "");
  const [isActived, setIsActived] = useState<boolean>(
    fileType?.IsActived ?? true
  );

  // Update form when fileType changes
  useEffect(() => {
    if (fileType) {
      setId(fileType.Id);
      setCode(fileType.Code || "");
      setName(fileType.Name || "");
      setIsActived(fileType.IsActived ?? true);
    }
  }, [fileType, isOpen]);

  const onSubmit = (isAddMore: boolean) => {
    if (!code.trim() || !name.trim()) {
      return;
    }
    saveChange(
      {
        Id: id,
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
      <DialogContent className="w-1/3">
        <DialogHeader>
          <DialogTitle>
            {fileType?.IsEdit ? "Cập nhật loại tệp" : "Thêm loại tệp"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Mã loại tệp</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Nhập mã loại tệp"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Tên loại tệp</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên loại tệp"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="isActived">Trạng thái</Label>
            <Select
              value={isActived ? "active" : "inactive"}
              onValueChange={(value) => setIsActived(value === "active")}
            >
              <SelectTrigger id="isActived">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Hủy
            </Button>
          </DialogClose>
          <Button onClick={() => onSubmit(false)}>
            {fileType?.IsEdit ? "Cập nhật" : "Thêm mới"}
          </Button>
          {!fileType?.IsEdit && (
            <Button onClick={() => onSubmit(true)} variant="secondary">
              Thêm và tiếp tục
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PopupFileType;
