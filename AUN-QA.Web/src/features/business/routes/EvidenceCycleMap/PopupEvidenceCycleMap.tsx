import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Loader2, RefreshCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import type { Attachment } from "@/features/file/types/uploadfile.types";
import { Combobox } from "@/components/ui/combobox";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { standardSetService } from "@/features/catalog/api/standardset.api";
import StandardCriteriaTable from "@/features/catalog/components/StandardCriteriaTable";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { EvidenceCycleMap, ModelVerifiedEvidenceForReuse } from "../../types/evidence-cycle-map.types";
import { evidenceCycleMapService } from "../../api/evidenceCycleMap.api";
import PopupReuseEvidence from "./PopupReuseEvidence";

interface PopupEvidenceCycleMapProps {
  evidenceCycleMap: EvidenceCycleMap | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (data: EvidenceCycleMap, isAddMore: boolean) => void;
  isLoading?: boolean;
  onApprove: (id: string, status: number, reason?: string) => void;
  isApproving?: boolean;
}

const PopupEvidenceCycleMap = ({
  evidenceCycleMap,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
  onApprove,
  isApproving,
}: PopupEvidenceCycleMapProps) => {
  // --- Form state ---
  const { user } = useAuth();
  const [assignedStandardIds, setAssignedStandardIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    id: evidenceCycleMap?.Id || uuidv4(),
    evidenceId: evidenceCycleMap?.EvidenceId || "",
    name: evidenceCycleMap?.Evidence?.Name || "",
    code: evidenceCycleMap?.Evidence?.Code || "",
    status: evidenceCycleMap?.Evidence?.Status?.toString() || "1",
    issueDate: evidenceCycleMap?.Evidence?.IssueDate
      ? format(new Date(evidenceCycleMap.Evidence.IssueDate), "yyyy-MM-dd")
      : "",
    issuingAuthority: evidenceCycleMap?.Evidence?.IssuingAuthority || "",
    expiryDate: evidenceCycleMap?.Evidence?.ExpiryDate
      ? format(new Date(evidenceCycleMap.Evidence.ExpiryDate), "yyyy-MM-dd")
      : "",
    fileTypeId: evidenceCycleMap?.Evidence?.FileTypeId || "",
    description: evidenceCycleMap?.Evidence?.Description || "",
    rejectionReason: evidenceCycleMap?.Evidence?.RejectionReason || "",
    cycleId: evidenceCycleMap?.CycleId || "",
  });

  const [standardSetId, setStandardSetId] = useState<string>("");
  const uploadRef = useRef<UploadFileRef>(null);
  const [folderUpload, setFolderUpload] = useState<string>(
    evidenceCycleMap?.Evidence?.FolderUpload || uuidv4(),
  );
  const [listAttachment, setListAttachment] = useState<Attachment[]>(
    evidenceCycleMap?.Evidence?.ListAttachment || [],
  );

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    fileTypeId?: string;
    cycleId?: string;
    issueDate?: string;
    expiryDate?: string;
    attachment?: string;
  }>({});

  const isPending = formData.status === "2" || formData.status === "3";

  // Approve/Reject dialog state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  // Reuse evidence popup state
  const [showReusePopup, setShowReusePopup] = useState(false);
  const [pendingReuseEvidence, setPendingReuseEvidence] =
    useState<ModelVerifiedEvidenceForReuse | null>(null);
  const queryClient = useQueryClient();

  const reuseMutation = useMutation({
    mutationFn: () =>
      evidenceCycleMapService.reuseVerifiedEvidence({
        EvidenceId: pendingReuseEvidence!.EvidenceId,
        TargetCycleId: formData.cycleId,
      }),
    onSuccess: () => {
      toast.success("Tái sử dụng minh chứng thành công");
      queryClient.invalidateQueries({ queryKey: ["evidenceCycleMapList"] });
      setPendingReuseEvidence(null);
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Có lỗi xảy ra");
    },
  });

  const cycleId_Change = async (val: string) => {
    if (val) {
      const res = await cycleService.getById(val);
      if (res.Success) {
        setStandardSetId(res.Data?.StandardSetId || "");
        // Extract assigned standards for current user
        const council = res.Data?.ListCouncil?.find(
          (c) => c.UserId === user?.Id,
        );
        setAssignedStandardIds(council?.AssignedStandardIds || []);
      }
    } else {
      setStandardSetId("");
      setAssignedStandardIds([]);
    }
  };

  // --- Sync form state when evidenceCycleMap prop changes ---
  useEffect(() => {
    if (evidenceCycleMap) {
      setFormData({
        id: evidenceCycleMap.Id || uuidv4(),
        evidenceId: evidenceCycleMap.EvidenceId || "",
        name: evidenceCycleMap.Evidence?.Name || "",
        code: evidenceCycleMap.Evidence?.Code || "",
        status: evidenceCycleMap.Evidence?.Status?.toString() || "1",
        issueDate: evidenceCycleMap.Evidence?.IssueDate
          ? format(new Date(evidenceCycleMap.Evidence.IssueDate), "yyyy-MM-dd")
          : "",
        issuingAuthority: evidenceCycleMap.Evidence?.IssuingAuthority || "",
        expiryDate: evidenceCycleMap.Evidence?.ExpiryDate
          ? format(new Date(evidenceCycleMap.Evidence.ExpiryDate), "yyyy-MM-dd")
          : "",
        fileTypeId: evidenceCycleMap.Evidence?.FileTypeId || "",
        description: evidenceCycleMap.Evidence?.Description || "",
        rejectionReason: evidenceCycleMap.Evidence?.RejectionReason || "",
        cycleId: evidenceCycleMap.CycleId || "",
      });
      setFolderUpload(evidenceCycleMap.Evidence?.FolderUpload || uuidv4());
      setListAttachment(evidenceCycleMap.Evidence?.ListAttachment || []);
      setErrors({});
    }

    cycleId_Change(evidenceCycleMap?.CycleId || "");
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

  const handleAttachmentChange = (attachments: Attachment[]) => {
    setListAttachment(attachments);
    if (errors.attachment) {
      setErrors((prev) => ({ ...prev, attachment: undefined }));
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

    if (!isPending) {
      const pendingFiles = uploadRef.current?.getPendingFiles() ?? [];
      if (listAttachment.length === 0 && pendingFiles.length === 0) {
        newErrors.attachment = "Vui lòng tải lên ít nhất một tệp đính kèm";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submission ---
  const onSubmit = async (isAddMore: boolean, status: number) => {
    if (!validateForm()) {
      return;
    }

    // Upload files first
    await uploadRef.current?.upload();

    // Construct data object with nested Evidence
    const saveData: EvidenceCycleMap = {
      Id: formData.id,
      EvidenceId: formData.evidenceId || uuidv4(),
      CycleId: formData.cycleId,
      ReviewStatus: evidenceCycleMap?.ReviewStatus || 1,
      Evidence: {
        Id: evidenceCycleMap?.Evidence?.Id || formData.evidenceId || uuidv4(),
        Name: formData.name,
        Code: formData.code,
        Status: status,
        IssueDate: formData.issueDate || undefined,
        IssuingAuthority: formData.issuingAuthority || undefined,
        ExpiryDate: formData.expiryDate || undefined,
        FileTypeId: formData.fileTypeId,
        Description: formData.description || undefined,
        CycleId: formData.cycleId,
        AttachmentIds: listAttachment.map((a) => a.Id),
        ListAttachment: listAttachment,
        IsEdit: evidenceCycleMap?.IsEdit || false,
        IsActived: evidenceCycleMap?.IsActived ?? true,
        FolderUpload: folderUpload,
        CreatedBy: evidenceCycleMap?.Evidence?.CreatedBy ?? "",
        CreatedAt: evidenceCycleMap?.Evidence?.CreatedAt ?? "",
      },
      IsEdit: evidenceCycleMap?.IsEdit || false,
      IsActived: evidenceCycleMap?.IsActived ?? true,
      FolderUpload: folderUpload,
      CreatedBy: evidenceCycleMap?.CreatedBy ?? "",
      CreatedAt: evidenceCycleMap?.CreatedAt ?? "",
    };

    saveChange(saveData, isAddMore);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) setPendingReuseEvidence(null);
          onOpenChange(open);
        }}
      >
        <DialogContent
          className="sm:max-w-6xl max-h-[95vh] flex flex-col min-h-0 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b pb-2">
            <DialogTitle>
              {evidenceCycleMap?.IsEdit
                ? "Cập nhật Minh chứng theo chu kỳ"
                : "Thêm mới Minh chứng theo chu kỳ"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Biểu mẫu thêm hoặc cập nhật minh chứng theo chu kỳ đánh giá.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Body - Split View 6/6 */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
              {/* LEFT COLUMN - General Information */}
              <div className="col-span-6 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 p-2">
                  {pendingReuseEvidence && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      <span className="mt-0.5 shrink-0">⚠️</span>
                      <span>
                        Đang xem trước minh chứng sẽ tái sử dụng. Nhấn{" "}
                        <strong>Xác nhận tái sử dụng</strong> để lưu, hoặc{" "}
                        <strong>Huỷ xem trước</strong> để chọn lại.
                      </span>
                    </div>
                  )}
                  {evidenceCycleMap?.Evidence?.Status === 4 && (
                    <Field>
                      <FieldLabel>
                        Lý do không duyệt{" "}
                        <span className="text-red-500">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <Textarea
                          value={formData.rejectionReason}
                          placeholder="Ví dụ: Quy định về đào tạo năm 2024"
                          readOnly={true}
                          className="bg-muted cursor-not-allowed"
                          rows={4}
                        />
                      </FieldContent>
                    </Field>
                  )}

                  {/* Name */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel>
                        Tên minh chứng <span className="text-red-500">*</span>
                      </FieldLabel>
                      {!isPending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowReusePopup(true)}
                          disabled={!formData.cycleId}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Tái sử dụng minh chứng cũ
                        </Button>
                      )}
                    </div>

                    <FieldContent>
                      <Input
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Ví dụ: Quy định về đào tạo năm 2024"
                        readOnly={isPending}
                        className={
                          isPending ? "bg-muted cursor-not-allowed" : ""
                        }
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
                          readOnly={isPending}
                          className={
                            isPending ? "bg-muted cursor-not-allowed" : ""
                          }
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
                          readonly={isPending}
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
                        setListAttachment={handleAttachmentChange}
                        readonly={isPending}
                        hasError={!!errors.attachment}
                      />
                      {errors.attachment && (
                        <FieldError>{errors.attachment}</FieldError>
                      )}
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
                        readOnly={isPending}
                        className={
                          isPending
                            ? "bg-muted cursor-not-allowed resize-none"
                            : ""
                        }
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
                          readOnly={isPending}
                          className={
                            isPending ? "bg-muted cursor-not-allowed" : ""
                          }
                        />
                        {errors.issueDate && (
                          <FieldError>{errors.issueDate}</FieldError>
                        )}
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>Ngày hết hạn</FieldLabel>
                      <FieldContent>
                        <Input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) =>
                            updateField("expiryDate", e.target.value)
                          }
                          readOnly={isPending}
                          className={
                            isPending ? "bg-muted cursor-not-allowed" : ""
                          }
                        />
                        {errors.expiryDate && (
                          <FieldError>{errors.expiryDate}</FieldError>
                        )}
                      </FieldContent>
                    </Field>
                  </div>

                  {/* Expiry Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field className="col-span-2">
                      <FieldLabel>Cơ quan ban hành</FieldLabel>
                      <FieldContent>
                        <Input
                          value={formData.issuingAuthority}
                          onChange={(e) =>
                            updateField("issuingAuthority", e.target.value)
                          }
                          placeholder="Tên cơ quan"
                          readOnly={isPending}
                          className={
                            isPending ? "bg-muted cursor-not-allowed" : ""
                          }
                        />
                      </FieldContent>
                    </Field>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Criteria Mapping */}
              <div className="col-span-6 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 p-2">
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
                          cycleId_Change(val || "");
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
                    selectedFileTypeId={formData.fileTypeId}
                    assignedStandardIds={assignedStandardIds}
                  />
                  {formData.cycleId && (
                    <p className="text-[11px] text-slate-400 px-1 pt-1 leading-relaxed">
                      Tiêu chí lọc theo loại tài liệu đã chọn.
                      Tiến độ cập nhật sau khi minh chứng được phê duyệt.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="border-t pt-2">
            {pendingReuseEvidence ? (
              <>
                <Button
                  variant="outline"
                  disabled={reuseMutation.isPending}
                  onClick={() => {
                    setPendingReuseEvidence(null);
                    setFormData({
                      id: evidenceCycleMap?.Id || uuidv4(),
                      evidenceId: evidenceCycleMap?.EvidenceId || "",
                      name: evidenceCycleMap?.Evidence?.Name || "",
                      code: evidenceCycleMap?.Evidence?.Code || "",
                      status:
                        evidenceCycleMap?.Evidence?.Status?.toString() || "1",
                      issueDate: evidenceCycleMap?.Evidence?.IssueDate
                        ? format(
                          new Date(evidenceCycleMap.Evidence.IssueDate),
                          "yyyy-MM-dd",
                        )
                        : "",
                      issuingAuthority:
                        evidenceCycleMap?.Evidence?.IssuingAuthority || "",
                      expiryDate: evidenceCycleMap?.Evidence?.ExpiryDate
                        ? format(
                          new Date(evidenceCycleMap.Evidence.ExpiryDate),
                          "yyyy-MM-dd",
                        )
                        : "",
                      fileTypeId: evidenceCycleMap?.Evidence?.FileTypeId || "",
                      description:
                        evidenceCycleMap?.Evidence?.Description || "",
                      rejectionReason:
                        evidenceCycleMap?.Evidence?.RejectionReason || "",
                      cycleId: formData.cycleId,
                    });
                  }}
                >
                  Huỷ xem trước
                </Button>
                <Button
                  onClick={() => reuseMutation.mutate()}
                  disabled={reuseMutation.isPending}
                >
                  {reuseMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Xác nhận tái sử dụng
                </Button>
              </>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isLoading}>
                    Hủy bỏ
                  </Button>
                </DialogClose>

                {formData.status === "2" ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setRejectionReason("");
                        setRejectionError("");
                        setShowRejectDialog(true);
                      }}
                      disabled={isLoading || isApproving}
                    >
                      Không duyệt
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setShowApproveConfirm(true)}
                      disabled={isLoading || isApproving}
                    >
                      Duyệt
                    </Button>
                  </>
                ) : (
                  <>
                    {formData.status !== "3" && (
                      <Button
                        onClick={() => onSubmit(false, 1)}
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Lưu
                      </Button>
                    )}
                    {!evidenceCycleMap?.IsEdit && (
                      <Button
                        onClick={() => onSubmit(false, 2)}
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Lưu và gửi
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        onConfirm={() => {
          onApprove(evidenceCycleMap!.Id, 3);
          setShowApproveConfirm(false);
        }}
        title="Xác nhận duyệt"
        description="Bạn có chắc chắn muốn duyệt minh chứng này không?"
        confirmText="Duyệt"
        confirmVariant="default"
        isLoading={isApproving}
        stopAutoClose={true}
      />

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Lý do không duyệt</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Field>
              <FieldLabel>
                Lý do <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (e.target.value.trim()) setRejectionError("");
                  }}
                  placeholder="Nhập lý do không duyệt..."
                  rows={4}
                />
                {rejectionError && <FieldError>{rejectionError}</FieldError>}
              </FieldContent>
            </Field>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isApproving}>
                Hủy bỏ
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isApproving}
              onClick={() => {
                if (!rejectionReason.trim()) {
                  setRejectionError("Vui lòng nhập lý do không duyệt");
                  return;
                }
                onApprove(evidenceCycleMap!.Id, 4, rejectionReason.trim());
                setShowRejectDialog(false);
              }}
            >
              {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PopupReuseEvidence
        isOpen={showReusePopup}
        onOpenChange={setShowReusePopup}
        targetCycleId={formData.cycleId}
        onReuseSuccess={(evidence: ModelVerifiedEvidenceForReuse) => {
          setPendingReuseEvidence(evidence);
          setFormData((prev) => ({
            ...prev,
            evidenceId: evidence.EvidenceId,
            name: evidence.evidenceName,
            code: evidence.evidenceCode,
            fileTypeId: evidence.FileTypeId || "",
            description: evidence.Description || "",
            issueDate: evidence.IssueDate
              ? format(new Date(evidence.IssueDate), "yyyy-MM-dd")
              : "",
            expiryDate: evidence.ExpiryDate
              ? format(new Date(evidence.ExpiryDate), "yyyy-MM-dd")
              : "",
            issuingAuthority: evidence.IssuingAuthority || "",
            status: "3",
          }));

          // Handle potential casing issues (PascalCase from C# vs camelCase from JSON serialization)
          const rawAttachments = (evidence as any).ListAttachment || (evidence as any).listAttachment || [];
          const normalizedAttachments: Attachment[] = rawAttachments.map((att: any) => ({
            Id: att.Id || att.id,
            ReferenceType: att.ReferenceType || att.referenceType,
            RelatedId: att.RelatedId || att.relatedId,
            FileName: att.FileName || att.fileName,
            FileExtension: att.FileExtension || att.fileExtension,
            FileSize: att.FileSize || att.fileSize,
            FileUrl: att.FileUrl || att.fileUrl,
            FullFileName: att.FullFileName || att.fullFileName,
          }));

          const rawFolder = (evidence as any).FolderUpload || (evidence as any).folderUpload;

          setFolderUpload(rawFolder || uuidv4());
          setListAttachment(normalizedAttachments);
        }}
      />
    </>
  );
};

export default PopupEvidenceCycleMap;
