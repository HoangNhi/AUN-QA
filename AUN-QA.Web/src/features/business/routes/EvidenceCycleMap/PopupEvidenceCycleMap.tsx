import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import UploadFile, { type UploadFileRef } from "@/components/ui/upload-file";
import type { EvidenceCycleMap } from "@/features/business/types/evidence.types";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import { Combobox } from "@/components/ui/combobox";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { standardSetService } from "@/features/catalog/api/standardset.api";
import StandardCriteriaTable from "@/features/catalog/components/StandardCriteriaTable";

interface PopupEvidenceCycleMapProps {
  evidenceCycleMap: EvidenceCycleMap | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (data: EvidenceCycleMap, isAddMore: boolean) => void;
  isLoading?: boolean;
}

const PopupEvidenceCycleMap = ({
  evidenceCycleMap,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: PopupEvidenceCycleMapProps) => {
  // --- Form state ---
  const [formData, setFormData] = useState({
    id: evidenceCycleMap?.Id || uuidv4(),
    name: evidenceCycleMap?.Name || "",
    code: evidenceCycleMap?.Code || "",
    status: evidenceCycleMap?.Status?.toString() || "1",
    issueDate: evidenceCycleMap?.IssueDate
      ? format(new Date(evidenceCycleMap.IssueDate), "yyyy-MM-dd")
      : "",
    issuingAuthority: evidenceCycleMap?.IssuingAuthority || "",
    expiryDate: evidenceCycleMap?.ExpiryDate
      ? format(new Date(evidenceCycleMap.ExpiryDate), "yyyy-MM-dd")
      : "",
    fileTypeId: evidenceCycleMap?.FileTypeId || "",
    description: evidenceCycleMap?.Description || "",
    rejectionReason: evidenceCycleMap?.RejectionReason || "",
    cycleId: evidenceCycleMap?.CycleId || "",
  });

  const [standardSetId, setStandardSetId] = useState<string>("");
  const uploadRef = useRef<UploadFileRef>(null);
  const [folderUpload, setFolderUpload] = useState<string>(
    evidenceCycleMap?.FolderUpload || uuidv4(),
  );
  const [listAttachment, setListAttachment] = useState<Attachment[]>(
    evidenceCycleMap?.ListAttachment || [],
  );

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    fileTypeId?: string;
    cycleId?: string;
    issueDate?: string;
    expiryDate?: string;
  }>({});

  // --- Sync form state when evidenceCycleMap prop changes ---
  useEffect(() => {
    if (evidenceCycleMap) {
      setFormData({
        id: evidenceCycleMap.Id || uuidv4(),
        name: evidenceCycleMap.Name || "",
        code: evidenceCycleMap.Code || "",
        status: evidenceCycleMap.Status?.toString() || "1",
        issueDate: evidenceCycleMap.IssueDate
          ? format(new Date(evidenceCycleMap.IssueDate), "yyyy-MM-dd")
          : "",
        issuingAuthority: evidenceCycleMap.IssuingAuthority || "",
        expiryDate: evidenceCycleMap.ExpiryDate
          ? format(new Date(evidenceCycleMap.ExpiryDate), "yyyy-MM-dd")
          : "",
        fileTypeId: evidenceCycleMap.FileTypeId || "",
        description: evidenceCycleMap.Description || "",
        rejectionReason: evidenceCycleMap.RejectionReason || "",
        cycleId: evidenceCycleMap.CycleId || "",
      });
      setFolderUpload(evidenceCycleMap.FolderUpload || uuidv4());
      setListAttachment(evidenceCycleMap.ListAttachment || []);
      setErrors({});
    }
  }, [evidenceCycleMap]);

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

  // --- Validation ---
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

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

    // Construct data object
    const saveData: EvidenceCycleMap = {
      Id: formData.id,
      EvidenceId: evidenceCycleMap?.EvidenceId || "",
      CycleId: formData.cycleId,
      ReviewStatus: evidenceCycleMap?.ReviewStatus || 1,
      Name: formData.name,
      Code: formData.code,
      Status: parseInt(formData.status),
      IssueDate: formData.issueDate || undefined,
      IssuingAuthority: formData.issuingAuthority || undefined,
      ExpiryDate: formData.expiryDate || undefined,
      FileTypeId: formData.fileTypeId,
      Description: formData.description || undefined,
      RejectionReason: formData.rejectionReason || undefined,
      AttachmentIds: listAttachment.map((a) => a.Id),
      ListAttachment: listAttachment,
      IsEdit: evidenceCycleMap?.IsEdit || false,
      IsActived: evidenceCycleMap?.IsActived ?? true,
      FolderUpload: folderUpload,
    };

    saveChange(saveData, isAddMore);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl max-h-[95vh] flex flex-col min-h-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b pb-2">
          <DialogTitle>
            {evidenceCycleMap?.IsEdit ? "Cập nhật Minh chứng theo chu kỳ" : "Thêm mới Minh chứng theo chu kỳ"}
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

                {/* Expiry Date */}
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

                {/* Standard Set */}
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
                <StandardCriteriaTable
                  cycleId={formData.cycleId}
                  fileTypeId={formData.fileTypeId}
                />
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
          {!evidenceCycleMap?.IsEdit && (
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

export default PopupEvidenceCycleMap;
