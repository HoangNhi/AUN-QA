import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import UploadFile, { type UploadFileRef } from "@/components/ui/upload-file";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import { Combobox } from "@/components/ui/combobox";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import MultiStandardSetPanel from "@/features/catalog/components/MultiStandardSetPanel";
import type { Evidence } from "@/features/business/types/evidence.types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

const formSchema = z
  .object({
    name: z.string().min(1, "Tên minh chứng không được để trống"),
    code: z.string().min(1, "Mã minh chứng không được để trống"),
    fileTypeId: z.string().min(1, "Vui lòng chọn loại tài liệu"),
    issueDate: z.string().optional().nullable(),
    issuingAuthority: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    rejectionReason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.issueDate && data.expiryDate) {
        return new Date(data.issueDate) <= new Date(data.expiryDate);
      }
      return true;
    },
    {
      message: "Ngày hết hạn phải sau ngày ban hành",
      path: ["expiryDate"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface PopupEvidenceProps {
  evidence: Evidence | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (evidence: Evidence, isAddMore: boolean) => void;
  isLoading?: boolean;
  onApprove: (id: string, status: number, reason?: string) => void;
  isApproving?: boolean;
}

const PopupEvidence = ({
  evidence,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
  onApprove,
  isApproving,
}: PopupEvidenceProps) => {
  const [id, setId] = useState<string>(evidence?.Id || uuidv4());
  const [status, setStatus] = useState<string>(
    evidence?.Status?.toString() || "1",
  );
  const [fileTypeName, setFileTypeName] = useState<string>("");
  const uploadRef = useRef<UploadFileRef>(null);
  const [folderUpload, setFolderUpload] = useState<string>(
    evidence?.FolderUpload || uuidv4(),
  );
  const [listAttachment, setListAttachment] = useState<Attachment[]>(
    evidence?.ListAttachment || [],
  );
  const [attachmentError, setAttachmentError] = useState<string>("");

  const isPending = status === "2" || status === "3";

  // Approve/Reject dialog state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: evidence?.Name || "",
      code: evidence?.Code || "",
      fileTypeId: evidence?.FileTypeId || "",
      issueDate: evidence?.IssueDate
        ? format(new Date(evidence.IssueDate), "yyyy-MM-dd")
        : "",
      issuingAuthority: evidence?.IssuingAuthority || "",
      expiryDate: evidence?.ExpiryDate
        ? format(new Date(evidence.ExpiryDate), "yyyy-MM-dd")
        : "",
      description: evidence?.Description || "",
      rejectionReason: evidence?.RejectionReason || "",
    },
  });

  useEffect(() => {
    if (evidence) {
      setId(evidence.Id || uuidv4());
      setStatus(evidence.Status?.toString() || "1");
      form.reset({
        name: evidence.Name || "",
        code: evidence.Code || "",
        fileTypeId: evidence.FileTypeId || "",
        issueDate: evidence.IssueDate
          ? format(new Date(evidence.IssueDate), "yyyy-MM-dd")
          : "",
        issuingAuthority: evidence.IssuingAuthority || "",
        expiryDate: evidence.ExpiryDate
          ? format(new Date(evidence.ExpiryDate), "yyyy-MM-dd")
          : "",
        description: evidence.Description || "",
        rejectionReason: evidence.RejectionReason || "",
      });
      setFolderUpload(evidence.FolderUpload || uuidv4());
      setListAttachment(evidence.ListAttachment || []);
      setAttachmentError("");
    }
  }, [evidence, form]);

  const handleAttachmentChange = (attachments: Attachment[]) => {
    setListAttachment(attachments);
    if (attachmentError) {
      setAttachmentError("");
    }
  };

  const onSubmit = async (values: FormValues, isAddMore: boolean, submitStatus: number) => {
    if (!isPending) {
      const pendingFiles = uploadRef.current?.getPendingFiles() ?? [];
      if (listAttachment.length === 0 && pendingFiles.length === 0) {
        setAttachmentError("Vui lòng tải lên ít nhất một tệp đính kèm");
        return;
      }
    }

    // Upload files first
    if (uploadRef.current) {
      await uploadRef.current.upload();
    }

    const evidenceData = {
      Id: id,
      Name: values.name,
      Code: values.code,
      Status: submitStatus,
      IssueDate: values.issueDate || undefined,
      IssuingAuthority: values.issuingAuthority || undefined,
      ExpiryDate: values.expiryDate || undefined,
      FileTypeId: values.fileTypeId,
      Description: values.description || undefined,
      RejectionReason: values.rejectionReason || undefined,
      AttachmentIds: listAttachment.map((a) => a.Id),
      ListAttachment: listAttachment,
      IsEdit: evidence?.IsEdit || false,
      IsActived: evidence?.IsActived ?? true,
      FolderUpload: folderUpload,
    } as Evidence;

    saveChange(evidenceData, isAddMore);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-6xl max-h-[95vh] flex flex-col min-h-0 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b pb-2">
            <DialogTitle>
              {evidence?.IsEdit
                ? "Cập nhật Minh chứng"
                : "Thêm mới Minh chứng"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Biểu mẫu thêm hoặc cập nhật minh chứng.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              className="flex-1 min-h-0 flex flex-col overflow-hidden"
              onSubmit={(e) => {
                e.preventDefault();
                // This acts as a default submit preventing accidental default handling, 
                // the actual submit is handled via buttons
              }}
            >
              {/* Scrollable Body - Split View 5/7 */}
              <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* LEFT COLUMN - General Information */}
                <div className="col-span-5 flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 p-2">
                    {/* Rejection reason (read-only, shown when rejected) */}
                    {status === "4" && (
                      <FormField
                        control={form.control}
                        name="rejectionReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                              Lý do không duyệt
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value || ""}
                                placeholder="Lý do không duyệt"
                                readOnly={true}
                                className="bg-muted cursor-not-allowed"
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                            Tên minh chứng
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ví dụ: Quy định về đào tạo năm 2024"
                              readOnly={isPending}
                              className={cn(
                                isPending && "bg-muted cursor-not-allowed",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Code and File Type Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                              Mã minh chứng
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="HC.01.02"
                                readOnly={isPending}
                                className={cn(
                                  isPending && "bg-muted cursor-not-allowed",
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fileTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                              Loại tài liệu
                            </FormLabel>
                            <FormControl>
                              <Combobox
                                fetchOptions={async () => {
                                  const res = await fileTypeService.getAllCombobox();
                                  return (res.Data || []).map((t) => ({
                                    Value: t.Value ?? "",
                                    Text: t.Text ?? "",
                                  }));
                                }}
                                value={field.value}
                                onValueChange={(val, text) => {
                                  field.onChange(val || "");
                                  setFileTypeName(text || "");
                                }}
                                placeholder="Chọn loại tài liệu"
                                searchPlaceholder="Tìm kiếm loại tài liệu..."
                                emptyText="Không tìm thấy loại tài liệu."
                                readonly={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Attachments */}
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        Tệp đính kèm
                      </FormLabel>
                      <FormControl>
                        <UploadFile
                          ref={uploadRef}
                          listAttachment={listAttachment}
                          folderUpload={folderUpload}
                          setListAttachment={handleAttachmentChange}
                          readonly={isPending}
                          hasError={!!attachmentError}
                        />
                      </FormControl>
                      {attachmentError && (
                        <p className="text-[0.8rem] font-medium text-destructive">
                          {attachmentError}
                        </p>
                      )}
                    </FormItem>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả tóm tắt</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="Nội dung chính..."
                              rows={3}
                              readOnly={isPending}
                              className={cn(
                                isPending &&
                                "bg-muted cursor-not-allowed resize-none",
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Issue Date and Expiry Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngày ban hành</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                                readOnly={isPending}
                                className={cn(
                                  isPending && "bg-muted cursor-not-allowed",
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngày hết hạn</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                                readOnly={isPending}
                                className={cn(
                                  isPending && "bg-muted cursor-not-allowed",
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Issuing Authority - full width */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="issuingAuthority"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Cơ quan ban hành</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Tên cơ quan"
                                readOnly={isPending}
                                className={cn(
                                  isPending && "bg-muted cursor-not-allowed",
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Criteria Satisfaction */}
                <div className="col-span-7 flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
                    <MultiStandardSetPanel
                      selectedFileTypeId={form.watch("fileTypeId")}
                      selectedFileTypeName={fileTypeName}
                    />
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

                {status === "2" ? (
                  <>
                    <Button
                      type="button"
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
                      type="button"
                      variant="default"
                      onClick={() => setShowApproveConfirm(true)}
                      disabled={isLoading || isApproving}
                    >
                      Duyệt
                    </Button>
                  </>
                ) : (
                  <>
                    {status !== "3" && (
                      <Button
                        type="button"
                        onClick={form.handleSubmit((values) =>
                          onSubmit(values, false, 1)
                        )}
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Lưu
                      </Button>
                    )}
                    {!evidence?.IsEdit && (
                      <Button
                        type="button"
                        onClick={form.handleSubmit((values) =>
                          onSubmit(values, false, 2)
                        )}
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
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        onConfirm={() => {
          onApprove(id, 3);
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
            <FormItem>
              <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Lý do
              </FormLabel>
              <FormControl>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (e.target.value.trim()) setRejectionError("");
                  }}
                  placeholder="Nhập lý do không duyệt..."
                  rows={4}
                />
              </FormControl>
              {rejectionError && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {rejectionError}
                </p>
              )}
            </FormItem>
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
                onApprove(id, 4, rejectionReason.trim());
                setShowRejectDialog(false);
              }}
            >
              {isApproving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PopupEvidence;
