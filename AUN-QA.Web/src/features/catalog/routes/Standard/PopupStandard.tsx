import { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Plus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { ACTIVE_STATUS_OPTIONS } from "@/constants/catalog.constants";
import { standardSetService } from "@/features/catalog/api/standardset.api";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import type {
  Standard,
  Criterion,
  CriterionRequirement,
} from "@/features/catalog/types/standard.types";
import { toast } from "sonner";

interface PopupStandardProps {
  standard: Standard | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (standard: Standard, isAddMore: boolean) => void;
  isLoading: boolean;
}

const PopupStandard = ({
  standard,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: PopupStandardProps) => {
  // Form state for Standard basic fields
  const [formData, setFormData] = useState({
    id: standard?.Id || uuidv4(),
    standardSetId: standard?.StandardSetId || "",
    code: standard?.Code || "",
    name: standard?.Name || "",
    description: standard?.Description || "",
    order: standard?.Order || 1,
    isActived: standard?.IsActived ?? true,
  });

  // StandardSet info for read-only display
  const [standardSetInfo, setStandardSetInfo] = useState<{
    name: string;
    description: string;
  } | null>(null);

  // Criterions state
  const [criterions, setCriterions] = useState<Criterion[]>(
    standard?.Criterions || [],
  );

  // Errors state
  const [errors, setErrors] = useState<{
    standardSetId?: string;
    code?: string;
    name?: string;
    order?: string;
    criterions?: string;
  }>({});

  // Fetch StandardSet options
  const { data: standardSetResponse } = useQuery({
    queryKey: ["standardSets", "combobox"],
    queryFn: () => standardSetService.getAllCombobox(),
    enabled: isOpen,
  });

  const standardSetOptions = standardSetResponse?.Data || [];

  // Fetch FileType options
  const { data: fileTypeResponse } = useQuery({
    queryKey: ["fileTypes", "combobox"],
    queryFn: () => fileTypeService.getAllCombobox(),
    enabled: isOpen,
  });

  const fileTypeOptions = fileTypeResponse?.Data || [];

  // Sync form data when standard changes
  useEffect(() => {
    if (standard) {
      setFormData({
        id: standard.Id || uuidv4(),
        standardSetId: standard.StandardSetId || "",
        code: standard.Code || "",
        name: standard.Name || "",
        description: standard.Description || "",
        order: standard.Order || 1,
        isActived: standard.IsActived ?? true,
      });
      setCriterions(standard.Criterions || []);
      setErrors({});

      // Fetch StandardSet info if StandardSetId exists
      if (standard.StandardSetId) {
        standardSetService.getById(standard.StandardSetId).then((response) => {
          if (response.Success && response.Data) {
            setStandardSetInfo({
              name: response.Data.Name,
              description: response.Data.Description || "",
            });
          }
        });
      } else {
        setStandardSetInfo(null);
      }
    }
  }, [standard]);

  // Handle StandardSet change
  const handleStandardSetChange = useCallback(
    async (val: string) => {
      setFormData((prev) => ({ ...prev, standardSetId: val }));
      if (errors.standardSetId) {
        setErrors((prev) => ({ ...prev, standardSetId: undefined }));
      }

      if (val) {
        const response = await standardSetService.getById(val);
        if (response.Success && response.Data) {
          setStandardSetInfo({
            name: response.Data.Name,
            description: response.Data.Description || "",
          });
        }
      } else {
        setStandardSetInfo(null);
      }
    },
    [errors.standardSetId],
  );

  // Field update helper
  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Criterion handlers
  const addCriterion = useCallback(() => {
    const nextOrder =
      criterions.length === 0
        ? 1
        : Math.max(...criterions.map((c) => c.Order || 0)) + 1;

    const newCriterion: Criterion = {
      Id: uuidv4(),
      StandardId: formData.id,
      Code: "",
      Name: "",
      IsPrerequisite: false,
      DiagnosticQuestions: "",
      Description: "",
      Order: nextOrder,
      CriterionRequirements: [
        {
          Id: uuidv4(),
          CriterionId: "",
          FileTypeId: "",
          IsMandatory: true,
          MinQuantity: 1,
          Suggestion: "",
          IsActived: true,
          IsEdit: false,
          FolderUpload: "",
          CreatedBy: "",
          CreatedAt: "",
        },
      ],
      IsActived: true,
      IsEdit: false,
      FolderUpload: "",
      CreatedBy: "",
      CreatedAt: "",
    };

    setCriterions((prev) => [...prev, newCriterion]);

    // Auto scroll to new criterion
    setTimeout(() => {
      const cards = document.querySelectorAll(".criterion-card");
      if (cards.length > 0) {
        cards[cards.length - 1].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  }, [criterions, formData.id]);

  const updateCriterion = useCallback(
    (id: string, updates: Partial<Criterion>) => {
      setCriterions((prev) =>
        prev.map((c) => (c.Id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const deleteCriterion = useCallback((id: string) => {
    setCriterions((prev) => prev.filter((c) => c.Id !== id));
  }, []);

  // File requirement handlers
  const addFileRequirement = useCallback((criterionId: string) => {
    setCriterions((prev) =>
      prev.map((c) => {
        if (c.Id === criterionId) {
          const newRequirement: CriterionRequirement = {
            Id: uuidv4(),
            CriterionId: criterionId,
            FileTypeId: "",
            IsMandatory: true,
            MinQuantity: 1,
            Suggestion: "",
            IsActived: true,
            IsEdit: false,
            FolderUpload: "",
            CreatedBy: "",
            CreatedAt: "",
          };
          return {
            ...c,
            CriterionRequirements: [
              ...(c.CriterionRequirements || []),
              newRequirement,
            ],
          };
        }
        return c;
      }),
    );
  }, []);

  const updateFileRequirement = useCallback(
    (
      criterionId: string,
      requirementId: string,
      updates: Partial<CriterionRequirement>,
    ) => {
      setCriterions((prev) =>
        prev.map((c) => {
          if (c.Id === criterionId) {
            return {
              ...c,
              CriterionRequirements: c.CriterionRequirements?.map((req) =>
                req.Id === requirementId ? { ...req, ...updates } : req,
              ),
            };
          }
          return c;
        }),
      );
    },
    [],
  );

  const deleteFileRequirement = useCallback(
    (criterionId: string, requirementId: string) => {
      setCriterions((prev) =>
        prev.map((c) => {
          if (c.Id === criterionId) {
            return {
              ...c,
              CriterionRequirements: c.CriterionRequirements?.filter(
                (req) => req.Id !== requirementId,
              ),
            };
          }
          return c;
        }),
      );
    },
    [],
  );

  // Validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Standard level validation
    if (!formData.standardSetId.trim()) {
      newErrors.standardSetId = "Bộ tiêu chuẩn không được để trống";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Mã tiêu chuẩn không được để trống";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Tên tiêu chuẩn không được để trống";
    }

    if (formData.order < 0) {
      newErrors.order = "Thứ tự phải lớn hơn hoặc bằng 0";
    }

    // Criterions validation
    if (criterions.length === 0) {
      newErrors.criterions = "Phải có ít nhất 1 tiêu chí";
      toast.error("Phải có ít nhất 1 tiêu chí");
    } else {
      // Validate each criterion
      for (const criterion of criterions) {
        if (!criterion.Code.trim() || !criterion.Name.trim()) {
          newErrors.criterions = "Tất cả tiêu chí phải có Mã và Tên";
          toast.error("Tất cả tiêu chí phải có Mã và Tên");
          break;
        }

        // Validate requirements
        if (
          !criterion.CriterionRequirements ||
          criterion.CriterionRequirements.length === 0
        ) {
          newErrors.criterions =
            "Mỗi tiêu chí phải có ít nhất 1 yêu cầu minh chứng";
          toast.error("Mỗi tiêu chí phải có ít nhất 1 yêu cầu minh chứng");
          break;
        }

        for (const req of criterion.CriterionRequirements) {
          if (!req.FileTypeId) {
            newErrors.criterions =
              "Tất cả yêu cầu minh chứng phải chọn Loại tài liệu";
            toast.error("Tất cả yêu cầu minh chứng phải chọn Loại tài liệu");
            break;
          }
          if (req.MinQuantity < 0) {
            newErrors.criterions = "Số lượng tối thiểu phải >= 0";
            toast.error("Số lượng tối thiểu phải >= 0");
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const onSubmit = (isAddMore: boolean) => {
    if (!validateForm()) {
      return;
    }

    // Build payload with nested structure
    const criterionsWithIds = criterions.map((c) => ({
      ...c,
      StandardId: formData.id,
      CriterionRequirements: c.CriterionRequirements?.map((req) => ({
        ...req,
        CriterionId: c.Id,
      })),
    }));

    const payload: Standard = {
      Id: formData.id,
      StandardSetId: formData.standardSetId,
      Code: formData.code.trim(),
      Name: formData.name.trim(),
      Description: formData.description.trim(),
      Order: formData.order,
      Criterions: criterionsWithIds,
      IsEdit: standard?.IsEdit || false,
      IsActived: formData.isActived,
      FolderUpload: standard?.FolderUpload || "",
      CreatedBy: standard?.CreatedBy || "",
      CreatedAt: standard?.CreatedAt || "",
      UpdatedAt: standard?.UpdatedAt || "",
    };

    saveChange(payload, isAddMore);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl max-h-[95vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {standard?.IsEdit ? "Cập nhật Tiêu chuẩn" : "Thêm mới Tiêu chuẩn"}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 bg-slate-50/50 space-y-8">
          {/* Section A: Standard Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 border-l-4 border-blue-500 pl-3">
              Thông tin tiêu chuẩn
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <Field>
                  <FieldLabel htmlFor="standardSet">
                    Bộ tiêu chuẩn <span className="text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Combobox
                      options={standardSetOptions}
                      value={formData.standardSetId}
                      onValueChange={handleStandardSetChange}
                      placeholder="Chọn bộ tiêu chuẩn"
                      searchPlaceholder="Tìm kiếm bộ tiêu chuẩn..."
                      emptyText="Không tìm thấy bộ tiêu chuẩn."
                    />
                    {errors.standardSetId && (
                      <FieldError>{errors.standardSetId}</FieldError>
                    )}
                  </FieldContent>
                </Field>
              </div>

              <div className="md:col-span-4">
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
                    {errors.code && <FieldError>{errors.code}</FieldError>}
                  </FieldContent>
                </Field>
              </div>

              <div className="md:col-span-4">
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
                    {errors.name && <FieldError>{errors.name}</FieldError>}
                  </FieldContent>
                </Field>
              </div>

              <div className="md:col-span-6 md:row-span-2">
                <Field>
                  <FieldLabel htmlFor="description">Mô tả</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      rows={4}
                      className="h-full min-h-30"
                      placeholder="Nhập mô tả chi tiết về tiêu chuẩn..."
                    />
                  </FieldContent>
                </Field>
              </div>

              <div className="md:col-span-6">
                <Field>
                  <FieldLabel htmlFor="order">
                    Thứ tự <span className="text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        updateField("order", parseInt(e.target.value) || 0)
                      }
                      min={0}
                    />
                    {errors.order && <FieldError>{errors.order}</FieldError>}
                  </FieldContent>
                </Field>
              </div>

              <div className="md:col-span-6">
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
            </div>
          </div>

          {/* Section B: Criteria Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                Danh sách Tiêu chí & Yêu cầu Minh chứng
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={addCriterion}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm tiêu chí
              </Button>
            </div>

            {errors.criterions && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                {errors.criterions}
              </div>
            )}

            {criterions.map((criterion) => (
              <div
                key={criterion.Id}
                className="criterion-card bg-white rounded-xl border border-slate-200 shadow-sm relative group animate-in overflow-hidden"
              >
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => deleteCriterion(criterion.Id)}
                  className="absolute top-2 right-2 z-20 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                  title="Xóa tiêu chí"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  {/* Left: Criterion Info */}
                  <div className="lg:col-span-5 p-5 bg-slate-50/30">
                    <div className="flex gap-4 mb-4">
                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Mã
                        </label>
                        <Input
                          value={criterion.Code}
                          onChange={(e) =>
                            updateCriterion(criterion.Id, {
                              Code: e.target.value,
                            })
                          }
                          placeholder="1.1"
                          className="text-center font-bold"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Tên tiêu chí
                        </label>
                        <Input
                          value={criterion.Name}
                          onChange={(e) =>
                            updateCriterion(criterion.Id, {
                              Name: e.target.value,
                            })
                          }
                          placeholder="Nhập tên tiêu chí..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* IsPrerequisite */}
                      <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                        <Checkbox
                          checked={criterion.IsPrerequisite}
                          onCheckedChange={(checked) =>
                            updateCriterion(criterion.Id, {
                              IsPrerequisite: checked === true,
                            })
                          }
                          className="h-4 w-4 rounded border-amber-300 text-amber-600"
                        />
                        <div>
                          <span className="block text-xs font-bold text-amber-800">
                            Tiêu chí điều kiện
                          </span>
                          <span className="block text-[10px] text-amber-600/80">
                            Nếu trượt tiêu chí này, cả tiêu chuẩn bị trượt
                          </span>
                        </div>
                      </label>

                      {/* DiagnosticQuestions */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Câu hỏi chẩn đoán
                        </label>
                        <Textarea
                          rows={3}
                          value={criterion.DiagnosticQuestions || ""}
                          onChange={(e) =>
                            updateCriterion(criterion.Id, {
                              DiagnosticQuestions: e.target.value,
                            })
                          }
                          placeholder="- Nhà trường có văn bản nào quy định về...?"
                          className="resize-none text-xs"
                        />
                        <p className="text-[9px] text-slate-400 mt-1 text-right">
                          Hỗ trợ viết báo cáo tự đánh giá
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: File Requirements */}
                  <div className="lg:col-span-7 p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-600 uppercase">
                        Yêu cầu minh chứng
                      </h4>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addFileRequirement(criterion.Id)}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 h-auto border border-blue-100"
                      >
                        + THÊM LOẠI FILE
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                      {criterion.CriterionRequirements?.map((req) => (
                        <div
                          key={req.Id}
                          className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col gap-2 hover:border-blue-200 transition-all animate-in"
                        >
                          <div className="flex items-center gap-2">
                            <Combobox
                              options={fileTypeOptions}
                              value={req.FileTypeId}
                              onValueChange={(val) =>
                                updateFileRequirement(criterion.Id, req.Id, {
                                  FileTypeId: val,
                                })
                              }
                              placeholder="-- Chọn loại tài liệu --"
                              searchPlaceholder="Tìm kiếm..."
                              emptyText="Không tìm thấy"
                              className="flex-1 text-xs h-8"
                            />

                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                SL:
                              </span>
                              <Input
                                type="number"
                                value={req.MinQuantity}
                                onChange={(e) =>
                                  updateFileRequirement(criterion.Id, req.Id, {
                                    MinQuantity: parseInt(e.target.value) || 1,
                                  })
                                }
                                min={1}
                                className="w-12 text-center text-xs font-bold h-6 px-1"
                              />
                            </div>

                            <label className="flex items-center gap-1 cursor-pointer select-none">
                              <Checkbox
                                checked={req.IsMandatory}
                                onCheckedChange={(checked) =>
                                  updateFileRequirement(criterion.Id, req.Id, {
                                    IsMandatory: checked === true,
                                  })
                                }
                                className="h-3 w-3 rounded border-slate-300 text-blue-600"
                              />
                              <span className="text-[10px] font-bold text-slate-500">
                                Bắt buộc
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                deleteFileRequirement(criterion.Id, req.Id)
                              }
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Suggestion Input */}
                          <Input
                            value={req.Suggestion || ""}
                            onChange={(e) =>
                              updateFileRequirement(criterion.Id, req.Id, {
                                Suggestion: e.target.value,
                              })
                            }
                            placeholder="Gợi ý: 'Quyết định thành lập hội đồng'..."
                            className="bg-transparent text-[11px] text-slate-600 italic placeholder:text-slate-300 border-b border-dashed border-slate-200 focus:border-blue-300 outline-none rounded-none h-6 px-1"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 italic">
                        Hệ thống sẽ đối chiếu danh sách này với file thực tế
                        user upload để báo cáo thiếu/đủ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
