import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ACTIVE_STATUS_OPTIONS } from "@/constants/catalog.constants";
import type { FileType } from "@/features/catalog/types/filetype.types";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const PopupFileType = ({
  fileType,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: {
  fileType: FileType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (
    fileType: FileType & { IsEdit: boolean },
    isAddMore: boolean,
  ) => void;
  isLoading?: boolean;
}) => {
  const [formData, setFormData] = useState({
    id: fileType?.Id || uuidv4(),
    code: fileType?.Code || "",
    name: fileType?.Name || "",
    isActived: fileType?.IsActived ?? true,
  });

  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
  }>({});

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Code validation
    const trimmedCode = formData.code.trim();
    if (!trimmedCode) {
      newErrors.code = "Mã loại file là bắt buộc";
    }

    // Name validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Tên loại file là bắt buộc";
    } else if (trimmedName.length < 2 || trimmedName.length > 200) {
      newErrors.name = "Tên phải từ 2-200 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sync form when fileType prop changes
  useEffect(() => {
    if (fileType) {
      setFormData({
        id: fileType.Id || uuidv4(),
        code: fileType.Code || "",
        name: fileType.Name || "",
        isActived: fileType.IsActived ?? true,
      });
      // Clear errors when form is populated with new data
      setErrors({});
    }
  }, [fileType]);

  const onSubmit = (isAddMore: boolean) => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      Id: formData.id,
      Code: formData.code.trim(),
      Name: formData.name.trim(),
      IsActived: formData.isActived,
      IsEdit: fileType?.IsEdit || false,
      FolderUpload: "",
    };
    saveChange(payload as FileType & { IsEdit: boolean }, isAddMore);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(false);
          }}
          noValidate
          aria-label={
            fileType?.IsEdit ? "Cập nhật Loại File" : "Thêm mới Loại File"
          }
        >
          <DialogHeader>
            <DialogTitle>
              {fileType?.IsEdit ? "Cập nhật Loại File" : "Thêm mới Loại File"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Code Field */}
            <Field>
              <FieldLabel htmlFor="code">
                Mã loại file <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  placeholder="Nhập mã loại file"
                  aria-required="true"
                  aria-invalid={errors.code ? "true" : "false"}
                  aria-describedby={
                    errors.code
                      ? "code-error code-description"
                      : "code-description"
                  }
                />
                {errors.code && (
                  <FieldError id="code-error">{errors.code}</FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Name Field */}
            <Field>
              <FieldLabel htmlFor="name">
                Tên loại file <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Nhập tên loại file"
                  aria-required="true"
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={
                    errors.name
                      ? "name-error name-description"
                      : "name-description"
                  }
                />
                {errors.name && (
                  <FieldError id="name-error">{errors.name}</FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Status Field */}
            <Field>
              <FieldLabel htmlFor="status">Trạng thái</FieldLabel>
              <FieldContent>
                <Combobox
                  options={ACTIVE_STATUS_OPTIONS}
                  value={formData.isActived.toString()}
                  onValueChange={(val) =>
                    updateField("isActived", val === "true")
                  }
                  placeholder="Chọn trạng thái"
                  searchPlaceholder="Tìm kiếm trạng thái..."
                  emptyText="Không tìm thấy trạng thái."
                />
              </FieldContent>
            </Field>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
            {!fileType?.IsEdit && (
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

export default PopupFileType;
