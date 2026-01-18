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
import { Textarea } from "@/components/ui/textarea";
import type { Stakeholder } from "@/features/catalog/types/stakeholder.types";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";

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
  // Form state as single object for cleaner code
  const [formData, setFormData] = useState({
    id: stakeholder?.Id || uuidv4(),
    fullName: stakeholder?.FullName || "",
    email: stakeholder?.Email || "",
    type: stakeholder?.Type?.toString() || "",
    description: stakeholder?.Description || "",
  });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: formData.id,
        FullName: formData.fullName,
        Email: formData.email,
        Type: parseInt(formData.type),
        Description: formData.description,
        IsEdit: stakeholder?.IsEdit || false,
        IsActived: stakeholder?.IsActived ?? true,
        FolderUpload: stakeholder?.FolderUpload || "",
      },
      isAddMore,
    );
  };

  useEffect(() => {
    setFormData({
      id: stakeholder?.Id || uuidv4(),
      fullName: stakeholder?.FullName || "",
      email: stakeholder?.Email || "",
      type: stakeholder?.Type?.toString() || "",
      description: stakeholder?.Description || "",
    });
  }, [stakeholder]);

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
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
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
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
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
              <Combobox
                options={STAKEHOLDER_TYPES}
                value={formData.type}
                onValueChange={(val) => updateField("type", val)}
                placeholder="Chọn loại bên liên quan"
                searchPlaceholder="Tìm kiếm loại bên liên quan..."
                emptyText="Không tìm thấy loại bên liên quan."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Nhập mô tả"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
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
