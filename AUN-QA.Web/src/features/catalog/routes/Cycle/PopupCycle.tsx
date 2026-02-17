import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Plus, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/datepicker";
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
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import type {
  Council,
  Cycle,
  EvaluationSchedule,
} from "@/features/catalog/types/cycle.types";
import { userService } from "@/features/system/api/user.api";
import {
  CYCLE_STATUS_OPTIONS,
  CYCLE_SCOPE_OPTIONS,
  COUNCIL_ROLES,
} from "@/constants/catalog.constants";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import { standardSetService } from "../../api/standardset.api";
import { standardService, type StandardOption } from "../../api/standard.api";

// Council role constants — matches CouncilRole enum in BE
const ROLE_HEAD = 1; // Chủ tịch HĐ — phụ trách tất cả TC
const ROLE_VICE = 2; // Phó Chủ tịch HĐ
const ROLE_SECRETARY = 3; // Thư ký — không cần phân công TC
const ROLE_EVALUATOR = 4; // Thành viên ĐG
const ROLE_PROVIDER = 5; // Người cung cấp MC

// --- Council table column factory ---
interface CouncilColumnHandlers {
  userOptions: { Value?: string; Text?: string }[];
  standards: StandardOption[];
  handleChangeCouncil: (
    id: string,
    field: keyof Council,
    value: string | number | boolean | string[],
  ) => void;
  handleDeleteCouncil: (id: string) => void;
}

function getCouncilColumns({
  userOptions,
  standards,
  handleChangeCouncil,
  handleDeleteCouncil,
}: CouncilColumnHandlers): ColumnDef<Council>[] {
  return [
    {
      id: "UserId",
      header: "Thành viên",
      meta: { className: "w-[220px]" },
      cell: ({ row }) => (
        <Combobox
          options={userOptions}
          value={row.original.UserId}
          onValueChange={(v) =>
            handleChangeCouncil(row.original.Id, "UserId", v)
          }
          placeholder="Chọn thành viên"
        />
      ),
    },
    {
      id: "RoleId",
      header: "Vai trò",
      meta: { className: "w-[160px]" },
      cell: ({ row }) => (
        <Combobox
          options={COUNCIL_ROLES}
          value={String(row.original.RoleId)}
          onValueChange={(v) =>
            handleChangeCouncil(row.original.Id, "RoleId", Number(v))
          }
          placeholder="Chọn vai trò"
        />
      ),
    },
    {
      id: "AssignedStandardIds",
      header: "Tiêu chuẩn phụ trách",
      cell: ({ row }) => {
        const role = Number(row.original.RoleId);
        if (role === ROLE_HEAD) {
          return (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Tất cả TC
            </span>
          );
        }
        if (role === ROLE_SECRETARY) {
          return (
            <span className="text-xs text-gray-400 italic">
              Không cần phân công
            </span>
          );
        }
        const selectedOptions: Option[] = (
          row.original.AssignedStandardIds ?? []
        ).map((id) => {
          const s = standards.find((x) => x.Id === id);
          return { value: id, label: s?.Code ?? id };
        });
        const allOptions: Option[] = standards.map((s) => ({
          value: s.Id,
          label: s.Code,
        }));
        return (
          <MultipleSelector
            value={selectedOptions}
            defaultOptions={allOptions}
            onChange={(opts) =>
              handleChangeCouncil(
                row.original.Id,
                "AssignedStandardIds",
                opts.map((o) => o.value),
              )
            }
            placeholder="Chọn tiêu chuẩn..."
            hidePlaceholderWhenSelected
          />
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="flex justify-center">Xóa</span>,
      meta: { className: "w-[60px] text-center" },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteCouncil(row.original.Id)}
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}

interface PopupCycleProps {
  cycle: Cycle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (cycle: Cycle, isAddMore: boolean) => void;
  isLoading: boolean;
}

const PopupCycle = ({
  cycle,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: PopupCycleProps) => {
  // --- Form state ---
  const [formData, setFormData] = useState({
    id: cycle?.Id || uuidv4(),
    name: cycle?.Name || "",
    year: cycle?.Year?.toString() || new Date().getFullYear().toString(),
    startDate: cycle?.StartDate
      ? format(new Date(cycle.StartDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    endDate: cycle?.EndDate
      ? format(new Date(cycle.EndDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    status: cycle?.Status?.toString() || "1",
    scope: cycle?.Scope?.toString() || "1",
    evaluationPurpose: cycle?.EvaluationPurpose || "",
    standardSetId: cycle?.StandardSetId || "",
  });

  const [listCouncil, setListCouncil] = useState<Council[]>(
    (cycle?.ListCouncil || []).map((c) => ({
      ...c,
      AssignedStandardIds: c.AssignedStandardIds ?? [],
    })),
  );
  const [listEvaluationSchedule, setListEvaluationSchedule] = useState<
    EvaluationSchedule[]
  >(cycle?.ListEvaluationSchedule || []);

  const [standards, setStandards] = useState<StandardOption[]>([]);

  const [errors, setErrors] = useState<{
    name?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    listCouncil?: string;
    listEvaluationSchedule?: string;
    standardSetId?: string;
    evaluationPurpose?: string;
  }>({});

  // --- Fetch user options ---
  const { data: userResponse } = useQuery({
    queryKey: ["users", "combobox"],
    queryFn: () => userService.getAllCombobox(),
    enabled: isOpen,
  });
  const userOptions = useMemo(
    () => userResponse?.Data ?? [],
    [userResponse?.Data],
  );

  // --- Fetch standards when standardSetId changes ---
  useEffect(() => {
    if (!formData.standardSetId) {
      setStandards([]);
      return;
    }
    standardService
      .getByStandardSetId(formData.standardSetId)
      .then((res) => setStandards(res.Data ?? []))
      .catch(() => setStandards([]));
  }, [formData.standardSetId]);

  // --- Sync form state when cycle prop changes ---
  useEffect(() => {
    if (cycle) {
      setFormData({
        id: cycle.Id || uuidv4(),
        name: cycle.Name || "",
        year: cycle.Year?.toString() || new Date().getFullYear().toString(),
        startDate: cycle.StartDate
          ? format(new Date(cycle.StartDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        endDate: cycle.EndDate
          ? format(new Date(cycle.EndDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        status: cycle.Status?.toString() || "1",
        scope: cycle.Scope?.toString() || "1",
        evaluationPurpose: cycle.EvaluationPurpose || "",
        standardSetId: cycle.StandardSetId || "",
      });
      setListCouncil(
        (cycle.ListCouncil || []).map((c) => ({
          ...c,
          AssignedStandardIds: c.AssignedStandardIds ?? [],
        })),
      );
      setListEvaluationSchedule(cycle.ListEvaluationSchedule || []);
      setErrors({});
    }
  }, [cycle]);

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

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newYear = e.target.value;
      if (!/^\d*$/.test(newYear)) return;
      if (newYear !== "" && parseInt(newYear) <= 0) return;
      setFormData((prev) => {
        const updated = { ...prev, year: newYear };
        if (newYear && newYear.length === 4) {
          const y = parseInt(newYear);
          if (!isNaN(y)) {
            if (prev.startDate) {
              const d = new Date(prev.startDate);
              d.setFullYear(y);
              updated.startDate = format(d, "yyyy-MM-dd");
            }
            if (prev.endDate) {
              const d = new Date(prev.endDate);
              d.setFullYear(y);
              updated.endDate = format(d, "yyyy-MM-dd");
            }
          }
        }
        return updated;
      });
      if (errors.year) {
        setErrors((prev) => ({ ...prev, year: undefined }));
      }
    },
    [errors.year],
  );

  // --- Council handlers ---
  const handleAddCouncil = useCallback(() => {
    setListCouncil((prev) => [
      ...prev,
      {
        Id: uuidv4(),
        CycleId: "",
        UserId: "",
        RoleId: ROLE_EVALUATOR,
        AssignedStandardIds: [],
        IsActived: true,
        IsEdit: false,
        FolderUpload: "",
      },
    ]);
  }, []);

  const handleDeleteCouncil = useCallback((id: string) => {
    setListCouncil((prev) => prev.filter((x) => x.Id !== id));
  }, []);

  const handleChangeCouncil = useCallback(
    (
      id: string,
      field: keyof Council,
      value: string | number | boolean | string[],
    ) => {
      setListCouncil((prev) =>
        prev.map((c) => (c.Id === id ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  // --- Evaluation schedule handlers ---
  const handleAddEvaluationSchedule = useCallback(() => {
    setListEvaluationSchedule((prev) => [
      ...prev,
      {
        Id: uuidv4(),
        CycleId: "",
        ActivityName: "",
        StartTime: format(new Date(), "yyyy-MM-dd"),
        EndTime: format(new Date(), "yyyy-MM-dd"),
        LeadId: "",
        IsActived: true,
        IsEdit: false,
        FolderUpload: "",
      },
    ]);
  }, []);

  const handleDeleteEvaluationSchedule = useCallback((id: string) => {
    setListEvaluationSchedule((prev) => prev.filter((x) => x.Id !== id));
  }, []);

  const handleChangeEvaluationSchedule = useCallback(
    (id: string, field: keyof EvaluationSchedule, value: string) => {
      setListEvaluationSchedule((prev) =>
        prev.map((c) => (c.Id === id ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  // --- Đ15 computed values ---
  const d15 = useMemo(() => {
    const totalMembers = listCouncil.length;
    const evaluatorCounts: Record<string, number> = {};
    const providerCounts: Record<string, number> = {};

    for (const s of standards) {
      evaluatorCounts[s.Id] = 0;
      providerCounts[s.Id] = 0;
    }

    for (const m of listCouncil) {
      const role = Number(m.RoleId);
      // Chairman implicitly covers all standards
      const effectiveIds =
        role === ROLE_HEAD
          ? standards.map((s) => s.Id)
          : (m.AssignedStandardIds ?? []);

      if (role === ROLE_EVALUATOR || role === ROLE_VICE) {
        for (const id of effectiveIds) {
          evaluatorCounts[id] = (evaluatorCounts[id] ?? 0) + 1;
        }
      }
      if (role === ROLE_PROVIDER || role === ROLE_HEAD) {
        for (const id of effectiveIds) {
          providerCounts[id] = (providerCounts[id] ?? 0) + 1;
        }
      }
    }

    const insufficientEval = standards.filter(
      (s) => (evaluatorCounts[s.Id] ?? 0) < 3,
    );
    const uncoveredProvider = standards.filter(
      (s) => (providerCounts[s.Id] ?? 0) === 0,
    );

    return {
      totalMembers,
      enoughMembers: totalMembers >= 9,
      evaluatorCounts,
      providerCounts,
      insufficientEval,
      uncoveredProvider,
    };
  }, [listCouncil, standards]);

  // --- Council TanStack table ---
  const councilColumns = useMemo(
    () =>
      getCouncilColumns({
        userOptions,
        standards,
        handleChangeCouncil,
        handleDeleteCouncil,
      }),
    [userOptions, standards, handleChangeCouncil, handleDeleteCouncil],
  );

  // --- Validation ---
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên kế hoạch không được để trống";
    }

    if (!formData.year.trim() || isNaN(parseInt(formData.year))) {
      newErrors.year = "Năm phải là số hợp lệ";
    } else if (parseInt(formData.year) <= 0) {
      newErrors.year = "Năm phải là số dương";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Ngày bắt đầu không được để trống";
    }

    if (!formData.endDate) {
      newErrors.endDate = "Ngày kết thúc không được để trống";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
    }

    if (listCouncil.some((c) => !c.UserId)) {
      newErrors.listCouncil = "Tất cả thành viên hội đồng phải được chọn";
      toast.error("Tất cả thành viên hội đồng phải được chọn");
    }

    if (listEvaluationSchedule.some((s) => !s.ActivityName.trim())) {
      newErrors.listEvaluationSchedule = "Tất cả hoạt động phải có tên";
      toast.error("Tất cả hoạt động phải có tên");
    }

    if (formData.standardSetId.trim() === "") {
      newErrors.standardSetId = "Bộ tiêu chuẩn không được để trống";
    }

    if (formData.evaluationPurpose.trim() === "") {
      newErrors.evaluationPurpose = "Mục đích đánh giá không được để trống";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submit ---
  const onSubmit = (isAddMore: boolean) => {
    if (!validateForm()) return;

    saveChange(
      {
        Id: formData.id,
        Name: formData.name.trim(),
        Year: parseInt(formData.year),
        StartDate: formData.startDate,
        EndDate: formData.endDate,
        Status: formData.status,
        EvaluationPurpose: formData.evaluationPurpose,
        StandardSetId: formData.standardSetId,
        Scope: parseInt(formData.scope),
        IsEdit: cycle?.IsEdit || false,
        IsActived: cycle?.IsActived ?? true,
        FolderUpload: cycle?.FolderUpload || "",
        ListCouncil: listCouncil.map((c) => ({
          ...c,
          CycleId: formData.id,
        })),
        ListEvaluationSchedule: listEvaluationSchedule.map((s) => ({
          ...s,
          CycleId: formData.id,
        })),
      },
      isAddMore,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl max-h-[95vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b pb-2">
          <DialogTitle>
            {cycle?.IsEdit ? "Cập nhật kế hoạch" : "Thêm mới kế hoạch"}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Basic info fields */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <Field>
                <FieldLabel>
                  Kế hoạch <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </FieldContent>
              </Field>
            </div>

            <div className="col-span-4">
              <Field>
                <FieldLabel>
                  Năm <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={handleYearChange}
                    min={1900}
                    max={2100}
                  />
                  {errors.year && <FieldError>{errors.year}</FieldError>}
                </FieldContent>
              </Field>
            </div>

            <div className="col-span-6">
              <Field>
                <FieldLabel>
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <DatePicker
                    className="w-full"
                    value={
                      formData.startDate
                        ? new Date(formData.startDate)
                        : undefined
                    }
                    onChange={(date) =>
                      updateField(
                        "startDate",
                        date ? format(date, "yyyy-MM-dd") : "",
                      )
                    }
                  />
                  {errors.startDate && (
                    <FieldError>{errors.startDate}</FieldError>
                  )}
                </FieldContent>
              </Field>
            </div>

            <div className="col-span-6">
              <Field>
                <FieldLabel>
                  Ngày kết thúc <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <DatePicker
                    className="w-full"
                    value={
                      formData.endDate ? new Date(formData.endDate) : undefined
                    }
                    onChange={(date) =>
                      updateField(
                        "endDate",
                        date ? format(date, "yyyy-MM-dd") : "",
                      )
                    }
                  />
                  {errors.endDate && <FieldError>{errors.endDate}</FieldError>}
                </FieldContent>
              </Field>
            </div>

            <div className="col-span-4">
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
                    value={formData.standardSetId}
                    onValueChange={(val) =>
                      updateField("standardSetId", val || "")
                    }
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

            <div className="col-span-4">
              <Field>
                <FieldLabel>Trạng thái</FieldLabel>
                <FieldContent>
                  <Combobox
                    options={CYCLE_STATUS_OPTIONS}
                    value={formData.status}
                    onValueChange={(val) => updateField("status", val || "1")}
                    placeholder="Chọn trạng thái"
                    searchPlaceholder="Tìm kiếm trạng thái..."
                    emptyText="Không tìm thấy trạng thái."
                  />
                </FieldContent>
              </Field>
            </div>

            <div className="col-span-4">
              <Field>
                <FieldLabel>Phạm vi</FieldLabel>
                <FieldContent>
                  <Combobox
                    options={CYCLE_SCOPE_OPTIONS}
                    value={formData.scope}
                    onValueChange={(val) => updateField("scope", val || "1")}
                    placeholder="Chọn phạm vi"
                    searchPlaceholder="Tìm kiếm phạm vi..."
                    emptyText="Không tìm thấy phạm vi."
                  />
                </FieldContent>
              </Field>
            </div>
          </div>

          {/* Tabs: Purpose / Council / Schedule */}
          <Tabs defaultValue="purpose">
            <TabsList>
              <TabsTrigger value="purpose">Mục đích đánh giá</TabsTrigger>
              <TabsTrigger value="council">Hội đồng</TabsTrigger>
              <TabsTrigger value="schedule">Thời gian biểu</TabsTrigger>
            </TabsList>

            {/* --- Purpose tab --- */}
            <TabsContent value="purpose">
              <Field>
                <FieldLabel>
                  Mục đích đánh giá <span className="text-red-500">*</span>
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Nhập mục đích đánh giá"
                    value={formData.evaluationPurpose}
                    onChange={(e) =>
                      updateField("evaluationPurpose", e.target.value)
                    }
                  />
                  {errors.evaluationPurpose && (
                    <FieldError>{errors.evaluationPurpose}</FieldError>
                  )}
                </FieldContent>
              </Field>
            </TabsContent>

            {/* --- Council tab --- */}
            <TabsContent value="council">
              <div className="grid gap-3">
                {/* Đ15 validation summary bar */}
                {listCouncil.length > 0 && (
                  <div className="rounded-lg border bg-gray-50 px-3 py-2.5 space-y-1 text-xs">
                    <p className="font-semibold text-gray-700 mb-1">
                      Kiểm tra Đ15
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          d15.enoughMembers
                            ? "text-green-600 font-bold"
                            : "text-red-500 font-bold"
                        }
                      >
                        {d15.enoughMembers ? "✓" : "✗"}
                      </span>
                      <span>
                        Tổng thành viên: <strong>{d15.totalMembers}</strong>
                        {!d15.enoughMembers && (
                          <span className="text-red-500 ml-1">
                            (cần ≥ 9 — Đ15.k1)
                          </span>
                        )}
                      </span>
                    </div>
                    {standards.length > 0 && (
                      <>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              d15.insufficientEval.length === 0
                                ? "text-green-600 font-bold"
                                : "text-amber-500 font-bold"
                            }
                          >
                            {d15.insufficientEval.length === 0 ? "✓" : "⚠"}
                          </span>
                          <span>
                            TC có &lt; 3 thành viên ĐG:{" "}
                            {d15.insufficientEval.length === 0 ? (
                              <span className="text-green-600">Tất cả đạt</span>
                            ) : (
                              <span className="text-amber-600">
                                {d15.insufficientEval
                                  .map((s) => s.Code)
                                  .join(", ")}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              d15.uncoveredProvider.length === 0
                                ? "text-green-600 font-bold"
                                : "text-amber-500 font-bold"
                            }
                          >
                            {d15.uncoveredProvider.length === 0 ? "✓" : "⚠"}
                          </span>
                          <span>
                            TC chưa có người cung cấp MC:{" "}
                            {d15.uncoveredProvider.length === 0 ? (
                              <span className="text-green-600">Tất cả đạt</span>
                            ) : (
                              <span className="text-amber-600">
                                {d15.uncoveredProvider
                                  .map((s) => s.Code)
                                  .join(", ")}
                              </span>
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Label>Danh sách hội đồng</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCouncil}
                    className="flex gap-2"
                  >
                    <Plus className="w-4 h-4" /> Thêm thành viên
                  </Button>
                </div>

                {errors.listCouncil && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">
                    {errors.listCouncil}
                  </div>
                )}

                <DataTable
                  columns={councilColumns}
                  data={listCouncil}
                  getRowId={(row) => row.Id}
                  containerClassName="max-h-[400px] overflow-auto w-full relative"
                  getRowClassName={(row) => {
                    const role = Number(row.RoleId);
                    const needsAssignment =
                      role !== ROLE_HEAD &&
                      role !== ROLE_SECRETARY &&
                      standards.length > 0 &&
                      (row.AssignedStandardIds ?? []).length === 0;
                    return needsAssignment ? "bg-amber-50" : undefined;
                  }}
                />

                {/* Working Group summary */}
                {standards.length > 0 && listCouncil.length > 0 && (
                  <div className="rounded-lg border p-3 bg-white">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Tổng hợp Nhóm công tác
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border px-2 py-1 text-left font-medium text-gray-600">
                              Tiêu chuẩn
                            </th>
                            <th className="border px-2 py-1 text-center font-medium text-gray-600">
                              Thành viên ĐG
                            </th>
                            <th className="border px-2 py-1 text-center font-medium text-gray-600">
                              Người cung cấp MC
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {standards.map((s) => {
                            const evCnt = d15.evaluatorCounts[s.Id] ?? 0;
                            const pvCnt = d15.providerCounts[s.Id] ?? 0;
                            return (
                              <tr
                                key={s.Id}
                                className={evCnt < 3 ? "bg-amber-50" : ""}
                              >
                                <td className="border px-2 py-1 font-medium text-gray-700">
                                  {s.Code}
                                </td>
                                <td
                                  className={`border px-2 py-1 text-center ${evCnt < 3
                                    ? "text-red-500 font-semibold"
                                    : "text-green-600"
                                    }`}
                                >
                                  {evCnt}
                                  {evCnt < 3 && (
                                    <span className="ml-1 text-red-400 font-normal">
                                      / 3
                                    </span>
                                  )}
                                </td>
                                <td
                                  className={`border px-2 py-1 text-center ${pvCnt === 0
                                    ? "text-amber-600 font-semibold"
                                    : "text-green-600"
                                    }`}
                                >
                                  {pvCnt}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* --- Schedule tab --- */}
            <TabsContent value="schedule">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Thời gian biểu đánh giá</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddEvaluationSchedule}
                    className="flex gap-2"
                  >
                    <Plus className="w-4 h-4" /> Thêm hoạt động
                  </Button>
                </div>
                {errors.listEvaluationSchedule && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">
                    {errors.listEvaluationSchedule}
                  </div>
                )}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hoạt động</TableHead>
                        <TableHead className="w-[180px]">Bắt đầu</TableHead>
                        <TableHead className="w-[180px]">Kết thúc</TableHead>
                        <TableHead className="w-[200px]">Phụ trách</TableHead>
                        <TableHead className="w-[80px] text-center">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listEvaluationSchedule.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            Chưa có dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        listEvaluationSchedule.map((item) => (
                          <TableRow key={item.Id}>
                            <TableCell>
                              <Input
                                value={item.ActivityName}
                                onChange={(e) =>
                                  handleChangeEvaluationSchedule(
                                    item.Id,
                                    "ActivityName",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <DatePicker
                                className="w-full"
                                value={
                                  item.StartTime
                                    ? new Date(item.StartTime)
                                    : undefined
                                }
                                onChange={(date) =>
                                  handleChangeEvaluationSchedule(
                                    item.Id,
                                    "StartTime",
                                    date ? format(date, "yyyy-MM-dd") : "",
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <DatePicker
                                className="w-full"
                                value={
                                  item.EndTime
                                    ? new Date(item.EndTime)
                                    : undefined
                                }
                                onChange={(date) =>
                                  handleChangeEvaluationSchedule(
                                    item.Id,
                                    "EndTime",
                                    date ? format(date, "yyyy-MM-dd") : "",
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.LeadId}
                                onValueChange={(value) =>
                                  handleChangeEvaluationSchedule(
                                    item.Id,
                                    "LeadId",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Chọn người phụ trách" />
                                </SelectTrigger>
                                <SelectContent>
                                  {userOptions.map((user) => (
                                    <SelectItem
                                      key={user.Value}
                                      value={user.Value || ""}
                                    >
                                      {user.Text}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteEvaluationSchedule(item.Id)
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Hủy
            </Button>
          </DialogClose>
          <Button onClick={() => onSubmit(false)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu
          </Button>
          {!cycle?.IsEdit && (
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

export default PopupCycle;
