import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Plus, Trash, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import UploadFile, { type UploadFileRef } from "@/components/ui/upload-file";
import type {
  Evidence,
  CriterionMapping,
} from "@/features/business/types/evidence.types";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import type { Standard } from "@/features/catalog/types/standard.types";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { standardService } from "@/features/catalog/api/standard.api";
import { EVIDENCE_STATUS_OPTIONS } from "@/constants/business.constants";

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

  const [listCriterionMap, setListCriterionMap] = useState<CriterionMapping[]>(
    [],
  );
  const [selectedStandardId, setSelectedStandardId] = useState<string>("");
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("");

  const uploadRef = useRef<UploadFileRef>(null);
  const [folderUpload, setFolderUpload] = useState<string>(
    evidence?.FolderUpload || uuidv4(),
  );
  const [listAttachment, setListAttachment] = useState<Attachment[]>(
    evidence?.ListAttachment || [],
  );

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    fileTypeId?: string;
    cycleId?: string;
    issueDate?: string;
    expiryDate?: string;
  }>({});

  // --- Fetch dropdown options ---
  const { data: fileTypeResponse } = useQuery({
    queryKey: ["fileTypes", "combobox"],
    queryFn: () => fileTypeService.getAllCombobox(),
    enabled: isOpen,
  });
  const fileTypeOptions = fileTypeResponse?.Data || [];

  const { data: cycleResponse } = useQuery({
    queryKey: ["cycles", "combobox"],
    queryFn: () => cycleService.getComboboxByUser(),
    enabled: isOpen,
  });
  const cycleOptions = cycleResponse?.Data || [];

  // Fetch standards when cycle is selected
  const { data: standardsResponse } = useQuery({
    queryKey: ["standards", "list", formData.cycleId],
    queryFn: async () => {
      // Get the cycle to find its StandardSetId
      const cycle = cycleOptions.find((c) => c.Value === formData.cycleId);
      if (!cycle) return { Data: { Data: [], TotalRow: 0 } };

      // Fetch standards for this cycle's standard set
      // Note: This assumes cycle has StandardSetId property. Adjust if needed.
      return standardService.getList({
        PageIndex: 1,
        PageSize: 100,
        // StandardSetId: cycle.StandardSetId, // Uncomment when available
      });
    },
    enabled: isOpen && !!formData.cycleId,
  });
  const standards = standardsResponse?.Data?.Data || [];

  // Fetch selected standard details to get criterions
  const { data: standardDetailResponse } = useQuery({
    queryKey: ["standard", "detail", selectedStandardId],
    queryFn: () => standardService.getById(selectedStandardId),
    enabled: isOpen && !!selectedStandardId,
  });
  const standardDetail = standardDetailResponse?.Data as Standard | undefined;
  const criterions = standardDetail?.Criterions || [];

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
      setListCriterionMap([]);
      setSelectedStandardId("");
      setSelectedCriterionId("");
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

  // --- Criterion mapping handlers ---
  const handleAddCriterion = useCallback(() => {
    if (!selectedStandardId || !selectedCriterionId) {
      toast.error("Vui lòng chọn tiêu chuẩn và tiêu chí");
      return;
    }

    // Find standard and criterion details
    const standard = standards.find((s) => s.Id === selectedStandardId);
    const criterion = criterions.find((c) => c.Id === selectedCriterionId);

    if (!standard || !criterion) {
      toast.error("Không tìm thấy thông tin tiêu chuẩn hoặc tiêu chí");
      return;
    }

    // Check for duplicates
    if (listCriterionMap.some((c) => c.CriterionId === selectedCriterionId)) {
      toast.error("Tiêu chí này đã được gán");
      return;
    }

    // Add to list
    setListCriterionMap((prev) => [
      ...prev,
      {
        Id: uuidv4(),
        StandardId: standard.Id,
        StandardName: standard.Name,
        StandardSetName: standard.StandardSet || "",
        CriterionId: criterion.Id,
        CriterionName: criterion.Name,
        CriterionCode: criterion.Code,
      },
    ]);

    // Reset selection
    setSelectedCriterionId("");
  }, [
    selectedStandardId,
    selectedCriterionId,
    standards,
    criterions,
    listCriterionMap,
  ]);

  const handleDeleteCriterion = useCallback((id: string) => {
    setListCriterionMap((prev) => prev.filter((c) => c.Id !== id));
  }, []);

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
                      <Select
                        value={formData.fileTypeId}
                        onValueChange={(value) =>
                          updateField("fileTypeId", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn loại tài liệu" />
                        </SelectTrigger>
                        <SelectContent>
                          {fileTypeOptions.map((option) => (
                            <SelectItem
                              key={option.Value}
                              value={option.Value || ""}
                            >
                              {option.Text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    Kế hoạch <span className="text-red-500">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={formData.cycleId}
                      onValueChange={(value) => {
                        updateField("cycleId", value);
                        setSelectedStandardId("");
                        setSelectedCriterionId("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- Chọn Kế hoạch --" />
                      </SelectTrigger>
                      <SelectContent>
                        {cycleOptions.map((option) => (
                          <SelectItem
                            key={option.Value}
                            value={option.Value || ""}
                          >
                            {option.Text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cycleId && (
                      <FieldError>{errors.cycleId}</FieldError>
                    )}
                  </FieldContent>
                </Field>

                {/* Standard Selection */}
                <Field>
                  <FieldLabel>Tiêu chuẩn (Standard)</FieldLabel>
                  <FieldContent>
                    <Select
                      value={selectedStandardId}
                      onValueChange={(value) => {
                        setSelectedStandardId(value);
                        setSelectedCriterionId("");
                      }}
                      disabled={!formData.cycleId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- Chọn Tiêu chuẩn --" />
                      </SelectTrigger>
                      <SelectContent>
                        {standards.map((standard) => (
                          <SelectItem key={standard.Id} value={standard.Id}>
                            {standard.Code} - {standard.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                {/* Criteria Selection and Add Button */}
                <Field>
                  <FieldLabel>Tiêu chí (Criteria)</FieldLabel>
                  <FieldContent>
                    <div className="flex gap-2">
                      <Select
                        value={selectedCriterionId}
                        onValueChange={setSelectedCriterionId}
                        disabled={!selectedStandardId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="-- Chọn Tiêu chí --" />
                        </SelectTrigger>
                        <SelectContent>
                          {criterions.map((criterion) => (
                            <SelectItem key={criterion.Id} value={criterion.Id}>
                              {criterion.Code} - {criterion.Name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddCriterion}
                        disabled={!selectedCriterionId}
                        className="flex gap-2 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm
                      </Button>
                    </div>
                  </FieldContent>
                </Field>

                {/* Criteria Table */}
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Danh sách tiêu chí đã gán:
                  </Label>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Tiêu chuẩn</TableHead>
                          <TableHead className="w-[35%]">Tiêu chí</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listCriterionMap.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center h-24 text-gray-500"
                            >
                              Chưa gán tiêu chí nào.
                            </TableCell>
                          </TableRow>
                        ) : (
                          listCriterionMap.map((criterion) => (
                            <TableRow key={criterion.Id}>
                              <TableCell>
                                <span className="text-xs font-semibold text-blue-700">
                                  {criterion.StandardSetName}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                {criterion.StandardName}
                              </TableCell>
                              <TableCell className="text-sm">
                                {criterion.CriterionCode} -{" "}
                                {criterion.CriterionName}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteCriterion(criterion.Id)
                                  }
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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
