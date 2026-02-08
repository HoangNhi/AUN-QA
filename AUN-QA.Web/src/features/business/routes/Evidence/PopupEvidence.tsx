import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import UploadFile, { type UploadFileRef } from "@/components/ui/upload-file";
import type { Evidence } from "@/features/business/types/evidence.types";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import type {
  Standard,
  CriterionRequirement,
} from "@/features/catalog/types/standard.types";
import { Combobox } from "@/components/ui/combobox";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { standardService } from "@/features/catalog/api/standard.api";
import { standardSetService } from "@/features/catalog/api/standardset.api";

interface PopupEvidenceProps {
  evidence: Evidence | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (evidence: Evidence, isAddMore: boolean) => void;
  isLoading: boolean;
}

const PopupEvidence = ({
  evidence,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: PopupEvidenceProps) => {
  // --- Form state ---
  const [formData, setFormData] = useState({
    id: evidence?.Id || uuidv4(),
    name: evidence?.Name || "",
    code: evidence?.Code || "",
    status: evidence?.Status?.toString() || "1",
    issueDate: evidence?.IssueDate
      ? format(new Date(evidence.IssueDate), "yyyy-MM-dd")
      : "",
    issuingAuthority: evidence?.IssuingAuthority || "",
    expiryDate: evidence?.ExpiryDate
      ? format(new Date(evidence.ExpiryDate), "yyyy-MM-dd")
      : "",
    fileTypeId: evidence?.FileTypeId || "",
    description: evidence?.Description || "",
    rejectionReason: evidence?.RejectionReason || "",
    cycleId: evidence?.CycleId || "",
  });

  const [standardSetId, setStandardSetId] = useState<string>("");
  const uploadRef = useRef<UploadFileRef>(null);
  const [folderUpload, setFolderUpload] = useState<string>(
    evidence?.FolderUpload || uuidv4(),
  );
  const [listAttachment, setListAttachment] = useState<Attachment[]>(
    evidence?.ListAttachment || [],
  );
  const [standardsWithCriteria, setStandardsWithCriteria] = useState<
    Standard[]
  >([]);
  const [criteriaLoading, setCriteriaLoading] = useState<boolean>(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [expandedStandardIds, setExpandedStandardIds] = useState<
    Record<string, boolean>
  >({});

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    fileTypeId?: string;
    cycleId?: string;
    issueDate?: string;
    expiryDate?: string;
  }>({});

  // --- Sync form state when evidence prop changes ---
  useEffect(() => {
    if (evidence) {
      setFormData({
        id: evidence.Id || uuidv4(),
        name: evidence.Name || "",
        code: evidence.Code || "",
        status: evidence.Status?.toString() || "1",
        issueDate: evidence.IssueDate
          ? format(new Date(evidence.IssueDate), "yyyy-MM-dd")
          : "",
        issuingAuthority: evidence.IssuingAuthority || "",
        expiryDate: evidence.ExpiryDate
          ? format(new Date(evidence.ExpiryDate), "yyyy-MM-dd")
          : "",
        fileTypeId: evidence.FileTypeId || "",
        description: evidence.Description || "",
        rejectionReason: evidence.RejectionReason || "",
        cycleId: evidence.CycleId || "",
      });
      setFolderUpload(evidence.FolderUpload || uuidv4());
      setListAttachment(evidence.ListAttachment || []);
      setErrors({});
    }
  }, [evidence]);

  // --- Helpers ---
  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleStandard = (standardId: string) => {
    setExpandedStandardIds((prev) => ({
      ...prev,
      [standardId]: !prev[standardId],
    }));
  };

  const getRequirementSummary = (requirements?: CriterionRequirement[]) => {
    if (!requirements || requirements.length === 0) {
      return { isMandatory: false, minQuantity: 0 };
    }

    return {
      isMandatory: requirements.some((req) => req.IsMandatory),
      minQuantity: Math.max(...requirements.map((req) => req.MinQuantity || 0)),
    };
  };

  const fetchStandardsWithCriteria = useCallback(
    async (cycleId: string, fileTypeId: string) => {
      setCriteriaLoading(true);
      setCriteriaError(null);

      try {
        const res = await standardService.getListWithCriteria({
          CycleId: cycleId,
          FileTypeId: fileTypeId,
        });

        if (res.Success) {
          const standards = (res.Data || []) as Standard[];
          setStandardsWithCriteria(standards);
          const expanded: Record<string, boolean> = {};
          standards.forEach((standard) => {
            expanded[standard.Id] = true;
          });
          setExpandedStandardIds(expanded);
        } else {
          setStandardsWithCriteria([]);
          setExpandedStandardIds({});
          setCriteriaError("Khong the tai danh sach tieu chuan.");
        }
      } catch (error) {
        console.error(error);
        setStandardsWithCriteria([]);
        setExpandedStandardIds({});
        setCriteriaError("Khong the tai danh sach tieu chuan.");
      } finally {
        setCriteriaLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!formData.cycleId || !formData.fileTypeId) {
      setStandardsWithCriteria([]);
      setExpandedStandardIds({});
      setCriteriaError(null);
      setCriteriaLoading(false);
      return;
    }

    fetchStandardsWithCriteria(formData.cycleId, formData.fileTypeId);
  }, [formData.cycleId, formData.fileTypeId, fetchStandardsWithCriteria]);

  // --- Validation ---
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = "Tên minh chứng không được để trống";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Mã minh chứng không được để trống";
    }

    if (!formData.fileTypeId) {
      newErrors.fileTypeId = "Vui lòng chọn loại tài liệu";
    }

    if (!formData.cycleId) {
      newErrors.cycleId = "Vui lòng chọn kế hoạch";
    }

    // Date range validation
    if (
      formData.issueDate &&
      formData.expiryDate &&
      formData.issueDate > formData.expiryDate
    ) {
      newErrors.expiryDate = "Ngày hết hạn phải sau ngày ban hành";
      toast.error("Ngày hết hạn phải sau ngày ban hành");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission ---
  const onSubmit = async (isAddMore: boolean) => {
    if (!validateForm()) {
      return;
    }

    // Upload files first
    await uploadRef.current?.upload();

    // Construct evidence object
    const evidenceData: Evidence = {
      Id: formData.id,
      Name: formData.name,
      Code: formData.code,
      Status: parseInt(formData.status),
      IssueDate: formData.issueDate || undefined,
      IssuingAuthority: formData.issuingAuthority || undefined,
      ExpiryDate: formData.expiryDate || undefined,
      FileTypeId: formData.fileTypeId,
      Description: formData.description || undefined,
      RejectionReason: formData.rejectionReason || undefined,
      CycleId: formData.cycleId,
      AttachmentIds: listAttachment.map((a) => a.Id),
      ListAttachment: listAttachment,
      IsEdit: evidence?.IsEdit || false,
      IsActived: evidence?.IsActived ?? true,
      FolderUpload: folderUpload,
    };

    saveChange(evidenceData, isAddMore);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl max-h-[95vh] flex flex-col min-h-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b pb-2">
          <DialogTitle>
            {evidence?.IsEdit ? "Cập nhật Minh chứng" : "Thêm mới Minh chứng"}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Body - Split View 6/6 */}
        <div className="flex-1 p-4 min-h-0 flex flex-col overflow-hidden">
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* LEFT COLUMN - General Information */}
            <div className="col-span-6 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {/* Name */}
                <Field>
                  <FieldLabel>
                    Tên minh chứng <span className="text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Ví dụ: Quy định về đào tạo năm 2024"
                    />
                    {errors.name && <FieldError>{errors.name}</FieldError>}
                  </FieldContent>
                </Field>

                {/* Code and File Type Row */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>
                      Mã minh chứng <span className="text-red-500">*</span>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        value={formData.code}
                        onChange={(e) => updateField("code", e.target.value)}
                        placeholder="HC.01.02"
                      />
                      {errors.code && <FieldError>{errors.code}</FieldError>}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      Loại tài liệu <span className="text-red-500">*</span>
                    </FieldLabel>
                    <FieldContent>
                      <Combobox
                        fetchOptions={async () => {
                          const res = await fileTypeService.getAllCombobox();
                          return (res.Data || []).map((t) => ({
                            Value: t.Value ?? "",
                            Text: t.Text ?? "",
                          }));
                        }}
                        value={formData.fileTypeId}
                        onValueChange={(val) => {
                          updateField("fileTypeId", val || "");
                        }}
                        placeholder="Chọn loại tài liệu"
                        searchPlaceholder="Tìm kiếm loại tài liệu..."
                        emptyText="Không tìm thấy loại tài liệu."
                      />
                      {errors.fileTypeId && (
                        <FieldError>{errors.fileTypeId}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                </div>

                {/* Attachments */}
                <Field>
                  <FieldLabel>
                    Tệp đính kèm <span className="text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <UploadFile
                      ref={uploadRef}
                      listAttachment={listAttachment}
                      folderUpload={folderUpload}
                      setListAttachment={setListAttachment}
                    />
                  </FieldContent>
                </Field>

                {/* Description */}
                <Field>
                  <FieldLabel>Mô tả tóm tắt</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      placeholder="Nội dung chính..."
                      rows={3}
                    />
                  </FieldContent>
                </Field>

                {/* Issue Date and Issuing Authority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Ngày ban hành</FieldLabel>
                    <FieldContent>
                      <Input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) =>
                          updateField("issueDate", e.target.value)
                        }
                      />
                      {errors.issueDate && (
                        <FieldError>{errors.issueDate}</FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Cơ quan ban hành</FieldLabel>
                    <FieldContent>
                      <Input
                        value={formData.issuingAuthority}
                        onChange={(e) =>
                          updateField("issuingAuthority", e.target.value)
                        }
                        placeholder="Tên cơ quan"
                      />
                    </FieldContent>
                  </Field>
                </div>

                {/* Expiry Date and Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Ngày hết hạn</FieldLabel>
                    <FieldContent>
                      <Input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) =>
                          updateField("expiryDate", e.target.value)
                        }
                      />
                      {errors.expiryDate && (
                        <FieldError>{errors.expiryDate}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Criteria Mapping */}
            <div className="col-span-6 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {/* Cycle Selection */}
                <Field>
                  <FieldLabel>
                    Chu kỳ <span className="text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Combobox
                      fetchOptions={async () => {
                        const res = await cycleService.getComboboxByUser();
                        return (res.Data || []).map((t) => ({
                          Value: t.Value ?? "",
                          Text: t.Text ?? "",
                        }));
                      }}
                      value={formData.cycleId}
                      onValueChange={async (val) => {
                        updateField("cycleId", val || "");
                        // Fetch and set standard set id based on selected cycle
                        if (val) {
                          const res = await cycleService.getById(val);
                          if (res.Success) {
                            setStandardSetId(res.Data?.StandardSetId || "");
                          }
                        } else {
                          setStandardSetId("");
                        }
                      }}
                      placeholder="Chọn chu kỳ"
                      searchPlaceholder="Tìm kiếm chu kỳ..."
                      emptyText="Không tìm thấy chu kỳ."
                    />
                    {errors.cycleId && (
                      <FieldError>{errors.cycleId}</FieldError>
                    )}
                  </FieldContent>
                </Field>

                {/* Standard Selection */}
                <Field>
                  <FieldLabel>
                    Bộ tiêu chuẩn <span className="text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Combobox
                      fetchOptions={async () => {
                        const res = await standardSetService.getAllCombobox();
                        return (res.Data || []).map((t) => ({
                          Value: t.Value ?? "",
                          Text: t.Text ?? "",
                        }));
                      }}
                      value={standardSetId}
                      onValueChange={(val) => setStandardSetId(val || "")}
                      placeholder="Chọn bộ tiêu chuẩn"
                      searchPlaceholder="Tìm kiếm bộ tiêu chuẩn..."
                      emptyText="Không tìm thấy bộ tiêu chuẩn."
                      readonly={true}
                    />
                  </FieldContent>
                </Field>

                {/* Criteria Table */}
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Danh sách tiêu chuẩn liên kết:
                  </Label>
                  <div className="rounded-md border bg-background">
                    {criteriaLoading ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Đang tải danh sách tiêu chuẩn...
                      </div>
                    ) : criteriaError ? (
                      <div className="px-4 py-6 text-center text-sm text-red-500">
                        {criteriaError}
                      </div>
                    ) : !formData.cycleId || !formData.fileTypeId ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Vui lòng chọn chu kỳ và loại tài liệu.
                      </div>
                    ) : standardsWithCriteria.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Chưa có dữ liệu tiêu chuẩn.
                      </div>
                    ) : (
                      <div className="divide-y divide-muted">
                        {standardsWithCriteria.map((standard) => {
                          const criterions = standard.Criterions || [];
                          const mandatoryCount = criterions.filter(
                            (criterion) =>
                              getRequirementSummary(
                                criterion.CriterionRequirements,
                              ).isMandatory,
                          ).length;

                          return (
                            <div key={standard.Id}>
                              <button
                                type="button"
                                className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                                onClick={() => toggleStandard(standard.Id)}
                              >
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold text-slate-900">
                                    {standard.Code} - {standard.Name}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>{criterions.length} tiêu chí</span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                      Bắt buộc: {mandatoryCount}
                                    </span>
                                  </div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-slate-700">
                                  {expandedStandardIds[standard.Id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </span>
                              </button>
                              {expandedStandardIds[standard.Id] && (
                                <div className="bg-slate-50/60 px-3 pb-4">
                                  <div className="space-y-3 pt-2">
                                    {criterions.map((criterion) => {
                                      const summary = getRequirementSummary(
                                        criterion.CriterionRequirements,
                                      );
                                      const isMandatory = summary.isMandatory;
                                      const requirementCount =
                                        criterion.CriterionRequirements
                                          ?.length || 0;

                                      return (
                                        <div
                                          key={criterion.Id}
                                          className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm animate-in transition-shadow hover:shadow-md ${
                                            isMandatory
                                              ? "border-l-4 border-l-red-300"
                                              : "border-l-4 border-l-slate-200"
                                          }`}
                                        >
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-2">
                                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                                {criterion.Code}
                                              </span>
                                              <div className="text-sm font-medium leading-6 text-slate-800">
                                                {criterion.Name}
                                              </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                              <span
                                                className={
                                                  summary.isMandatory
                                                    ? "rounded-full bg-red-100 px-2 py-0.5 text-red-700"
                                                    : "rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"
                                                }
                                              >
                                                {summary.isMandatory
                                                  ? "Bắt buộc"
                                                  : "Không bắt buộc"}
                                              </span>
                                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                                Số lượng:{" "}
                                                {summary.minQuantity || "-"}
                                              </span>
                                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                                Yêu cầu: {requirementCount}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button onClick={() => onSubmit(false)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu
          </Button>
          {!evidence?.IsEdit && (
            <Button onClick={() => onSubmit(true)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu và thêm tiếp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PopupEvidence;
