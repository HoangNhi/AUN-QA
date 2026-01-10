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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Stakeholder } from "@/features/catalog/types/stakeholder.types";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

const PopupStakeholder = ({
  stakeholder,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: {
  stakeholder: Stakeholder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (stakeholder: Stakeholder, isAddMore: boolean) => void;
  isLoading?: boolean;
}) => {
  const [id, setId] = useState<string>(stakeholder?.Id || uuidv4());
  const [fullName, setFullName] = useState(stakeholder?.FullName || "");
  const [email, setEmail] = useState(stakeholder?.Email || "");
  const [type, setType] = useState(stakeholder?.Type?.toString() || "6");
  const [description, setDescription] = useState(
    stakeholder?.Description || ""
  );

  useEffect(() => {
    if (stakeholder) {
      setId(stakeholder.Id || uuidv4());
      setFullName(stakeholder.FullName || "");
      setEmail(stakeholder.Email || "");
      setType(stakeholder.Type?.toString() || "6");
      setDescription(stakeholder.Description || "");
    } else {
    }
  }, [stakeholder]);

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id,
        FullName: fullName,
        Email: email,
        Type: parseInt(type),
        Description: description,
        IsEdit: stakeholder?.IsEdit || false,
        IsActived: stakeholder?.IsActived ?? true,
        FolderUpload: stakeholder?.FolderUpload || "",
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
          <DialogHeader className="border-b pb-2">
            <DialogTitle>
              {stakeholder?.IsEdit
                ? "Cập nhật đối tượng khảo sát"
                : "Thêm mới đối tượng khảo sát"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="fullname"
                className="after:content-['*'] after:ml-0.5 after:text-red-500"
              >
                Họ và tên
              </Label>
              <Input
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Nhập họ và tên"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className="after:content-['*'] after:ml-0.5 after:text-red-500"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Nhập email"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="type"
                className="after:content-['*'] after:ml-0.5 after:text-red-500"
              >
                Loại bên liên quan
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Chọn loại bên liên quan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Sinh viên</SelectItem>
                  <SelectItem value="2">Cựu sinh viên</SelectItem>
                  <SelectItem value="4">Giảng viên</SelectItem>
                  <SelectItem value="3">Nhà tuyển dụng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Nhập mô tả"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-2">
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
            {!stakeholder?.IsEdit && (
              <Button
                type="button"
                onClick={() => onSubmit(true)}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu và thêm tiếp
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupStakeholder;
