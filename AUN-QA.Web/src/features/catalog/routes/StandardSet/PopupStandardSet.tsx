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
import {
  ACTIVE_STATUS_OPTIONS,
  EVALUATION_MODE_OPTIONS,
} from "@/constants/catalog.constants";
import type { StandardSet } from "@/features/catalog/types/standardset.types";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const PopupStandardSet = ({
  standardSet,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: {
  standardSet: StandardSet | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (
    standardSet: StandardSet & { IsEdit: boolean },
    isAddMore: boolean,
  ) => void;
  isLoading?: boolean;
}) => {
  const [formData, setFormData] = useState({
    id: standardSet?.Id || uuidv4(),
    code: standardSet?.Code || "",
    name: standardSet?.Name || "",
    evaluationMode: standardSet?.EvaluationMode ?? 1,
    isActived: standardSet?.IsActived ?? true,
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
      newErrors.code = "Mã bộ tiêu chuẩn là bắt buộc";
    }

    // Name validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Tên bộ tiêu chuẩn là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sync form when standardSet prop changes
  useEffect(() => {
    if (standardSet) {
      setFormData({
        id: standardSet.Id || uuidv4(),
        code: standardSet.Code || "",
        name: standardSet.Name || "",
        evaluationMode: standardSet.EvaluationMode ?? 1,
        isActived: standardSet.IsActived ?? true,
      });
      // Clear errors when form is populated with new data
      setErrors({});
    }
  }, [standardSet]);

  const onSubmit = (isAddMore: boolean) => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      Id: formData.id,
      Code: formData.code.trim(),
      Name: formData.name.trim(),
      EvaluationMode: formData.evaluationMode,
      IsActived: formData.isActived,
      IsEdit: standardSet?.IsEdit || false,
      FolderUpload: "",
      CreatedBy: "",
      CreatedAt: "",
      UpdatedBy: "",
      UpdatedAt: "",
    };
    saveChange(payload as StandardSet & { IsEdit: boolean }, isAddMore);
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
            standardSet?.IsEdit
              ? "Cập nhật Bộ Tiêu Chuẩn"
              : "Thêm mới Bộ Tiêu Chuẩn"
          }
        >
          <DialogHeader>
            <DialogTitle>
              {standardSet?.IsEdit
                ? "Cập nhật Bộ Tiêu Chuẩn"
                : "Thêm mới Bộ Tiêu Chuẩn"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Code Field */}
            <Field>
              <FieldLabel htmlFor="code">
                Mã bộ tiêu chuẩn <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  placeholder="Nhập mã bộ tiêu chuẩn"
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
                Tên bộ tiêu chuẩn <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Nhập tên bộ tiêu chuẩn"
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

            {/* Evaluation Mode Field */}
            <Field>
              <FieldLabel htmlFor="evaluationMode">
                Chế độ đánh giá <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Combobox
                  options={EVALUATION_MODE_OPTIONS}
                  value={formData.evaluationMode.toString()}
                  onValueChange={(val) =>
                    updateField("evaluationMode", Number(val))
                  }
                  placeholder="Chọn chế độ đánh giá"
                  searchPlaceholder="Tìm kiếm chế độ đánh giá..."
                  emptyText="Không tìm thấy chế độ đánh giá."
                />
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
            {!standardSet?.IsEdit && (
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

export default PopupStandardSet;
