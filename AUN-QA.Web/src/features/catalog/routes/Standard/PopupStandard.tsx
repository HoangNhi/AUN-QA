import { useEffect, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
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
import { Textarea } from "@/components/ui/textarea";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import type {
  Standard,
  Criterion,
} from "@/features/catalog/types/standard.types";
import type { ModelCombobox } from "@/types/base/base.types";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { ACTIVE_STATUS_OPTIONS } from "@/constants/catalog.constants";
import { useStandardCriteria } from "@/features/catalog/hooks/useStandardCriteria";

interface StandardTableMeta {
  onUpdate: (id: string, updates: Partial<Criterion>) => void;
  onDelete: (id: string) => void;
  fileTypes: ModelCombobox[];
}

const getCriterionColumns = (): ColumnDef<Criterion>[] => [
  {
    accessorKey: "Order",
    header: () => <div className="text-center">STT</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as StandardTableMeta;
      return (
        <div className="text-center">
          <Input
            type="number"
            value={row.original.Order}
            onChange={(e) =>
              meta?.onUpdate(row.original.Id, {
                Order: parseInt(e.target.value) || 1,
              })
            }
            className="h-8 w-16 text-center text-sm"
            min={1}
          />
        </div>
      );
    },
    meta: { className: "w-28" },
  },
  {
    accessorKey: "Code",
    header: () => (
      <div>
        Mã tiêu chí <span className="text-red-500">*</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const meta = table.options.meta as StandardTableMeta;
      return (
        <Input
          value={row.original.Code}
          onChange={(e) =>
            meta?.onUpdate(row.original.Id, { Code: e.target.value })
          }
          placeholder="Nhập mã"
          className="h-8 text-sm min-w-[150px]"
        />
      );
    },
    meta: { className: "min-w-[180px]" },
  },
  {
    accessorKey: "Name",
    header: () => (
      <div>
        Tên tiêu chí <span className="text-red-500">*</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const meta = table.options.meta as StandardTableMeta;
      return (
        <Input
          value={row.original.Name}
          onChange={(e) =>
            meta?.onUpdate(row.original.Id, { Name: e.target.value })
          }
          placeholder="Nhập tên"
          className="h-8 text-sm min-w-[200px]"
        />
      );
    },
    meta: { className: "min-w-[230px]" },
  },
  {
    accessorKey: "Description",
    header: "Mô tả",
    cell: ({ row, table }) => {
      const meta = table.options.meta as StandardTableMeta;
      return (
        <Input
          value={row.original.Description || ""}
          onChange={(e) =>
            meta?.onUpdate(row.original.Id, { Description: e.target.value })
          }
          placeholder="Mô tả (tùy chọn)"
          className="h-8 text-sm min-w-[180px]"
        />
      );
    },
    meta: { className: "min-w-[200px]" },
  },
  {
    accessorKey: "FileTypeId",
    header: () => (
      <div>
        Loại tệp <span className="text-red-500">*</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const meta = table.options.meta as StandardTableMeta;
      return (
        <Combobox
          options={meta?.fileTypes || []}
          value={row.original.FileTypeId}
          onValueChange={(val) =>
            meta?.onUpdate(row.original.Id, { FileTypeId: val })
          }
          placeholder="Chọn loại tệp"
          searchPlaceholder="Tìm kiếm..."
          emptyText="Không tìm thấy"
          className="h-8 text-sm min-w-[220px]"
        />
      );
    },
    meta: { className: "min-w-[250px]" },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Thao tác</div>,
    meta: { className: "w-24" },
    cell: ({ row, table }) => {
      const meta = table.options.meta as StandardTableMeta;
      return (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  `Bạn có chắc chắn muốn xóa tiêu chí "${row.original.Name || "này"}"?`,
                )
              ) {
                meta?.onDelete(row.original.Id);
              }
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

const PopupStandard = ({
  standard,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: {
  standard: Standard | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (standard: Standard, isAddMore: boolean) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    id: standard?.Id || uuidv4(),
    code: standard?.Code || "",
    name: standard?.Name || "",
    description: standard?.Description || "",
    isActived: standard?.IsActived ?? true,
  });

  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    criterions?: string;
  }>({});

  const { criterions, setCriterions, handlers } = useStandardCriteria(
    standard?.Criterions || [],
  );

  // Fetch FileTypes for Criterion editor
  const { data: fileTypesResponse } = useQuery({
    queryKey: ["fileTypes", "combobox"],
    queryFn: () => fileTypeService.getAllCombobox(),
    enabled: isOpen,
  });

  const fileTypes = fileTypesResponse?.Data || [];

  // Configure columns for criterion DataTable
  // Configure columns for criterion DataTable
  const columns = useMemo(() => getCriterionColumns(), []);

  const tableMeta = useMemo(
    () => ({
      onUpdate: handlers.updateCriterion,
      onDelete: (id: string) => {
        handlers.deleteCriterion(id);
        toast.success("Xóa tiêu chí thành công");
      },
      fileTypes,
    }),
    [handlers, fileTypes],
  );

  // Sync form data when standard changes
  useEffect(() => {
    if (standard) {
      setFormData({
        id: standard.Id || uuidv4(),
        code: standard.Code || "",
        name: standard.Name || "",
        description: standard.Description || "",
        isActived: standard.IsActived ?? true,
      });
      setCriterions(standard.Criterions || []);
      setErrors({});
    }
  }, [standard, setCriterions]);

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Mã tiêu chuẩn không được để trống";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Tên tiêu chuẩn không được để trống";
    }

    if (criterions.length === 0) {
      newErrors.criterions = "Phải có ít nhất 1 tiêu chí";
      toast.error("Phải có ít nhất 1 tiêu chí");
    } else if (!handlers.validateCriterions()) {
      newErrors.criterions =
        "Các tiêu chí phải có đầy đủ thông tin (Mã, Tên, Loại tệp)";
      toast.error("Các tiêu chí phải có đầy đủ thông tin (Mã, Tên, Loại tệp)");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (isAddMore: boolean) => {
    if (!validateForm()) {
      return;
    }

    // Update StandardId for all criterions
    const criterionsWithStandardId = criterions.map((c) => ({
      ...c,
      StandardId: formData.id,
    }));

    saveChange(
      {
        Id: formData.id,
        Code: formData.code,
        Name: formData.name,
        Description: formData.description,
        Criterions: criterionsWithStandardId,
        IsEdit: standard?.IsEdit || false,
        IsActived: formData.isActived,
        FolderUpload: standard?.FolderUpload || "",
        CreatedBy: standard?.CreatedBy || "",
        CreatedAt: standard?.CreatedAt || "",
        UpdatedAt: standard?.UpdatedAt || "",
      },
      isAddMore,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {standard?.IsEdit ? "Cập nhật Tiêu chuẩn" : "Thêm mới Tiêu chuẩn"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex-1 overflow-y-auto space-y-6 px-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(false);
          }}
        >
          {/* General Info Section */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <h3 className="font-semibold text-lg border-l-4 border-primary pl-3">
              Thông tin chung
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="code">
                  Mã tiêu chuẩn <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    placeholder="VD: AUN-QA-01"
                  />
                  {errors.code && (
                    <FieldError id="code-error">{errors.code}</FieldError>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="name">
                  Tên tiêu chuẩn <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="VD: Mục tiêu dự kiến của chương trình đào tạo"
                  />
                  {errors.name && (
                    <FieldError id="name-error">{errors.name}</FieldError>
                  )}
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Mô tả</FieldLabel>
              <FieldContent>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  placeholder="Nhập mô tả chi tiết về tiêu chuẩn..."
                />
              </FieldContent>
            </Field>

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

          {/* Criterions Section */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg border-l-4 border-primary pl-3">
                Danh sách tiêu chí <span className="text-red-500">*</span>
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const nextOrder =
                    criterions.length === 0
                      ? 1
                      : Math.max(...criterions.map((c) => c.Order || 0)) + 1;

                  handlers.addCriterion({
                    Id: uuidv4(),
                    Code: "",
                    Name: "",
                    Description: "",
                    FileTypeId: "",
                    Order: nextOrder,
                    IsActived: true,
                    IsEdit: false,
                    FolderUpload: "",
                    CreatedBy: "",
                    CreatedAt: "",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm tiêu chí
              </Button>
            </div>

            {errors.criterions && (
              <div className="text-sm text-red-500 mb-2">
                {errors.criterions}
              </div>
            )}

            <DataTable
              columns={columns}
              data={criterions}
              meta={tableMeta}
              containerClassName="max-h-[400px] overflow-x-auto overflow-y-auto"
            />
          </div>
        </form>

        <DialogFooter className="px-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Hủy
            </Button>
          </DialogClose>
          <Button onClick={() => onSubmit(false)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu
          </Button>
          {!standard?.IsEdit && (
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
      </DialogContent>
    </Dialog>
  );
};

export default PopupStandard;
