import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@/constants/catalog.constants";
import { standardSetService } from "../../api/standardset.api";

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
    cycle?.ListCouncil || [],
  );
  const [listEvaluationSchedule, setListEvaluationSchedule] = useState<
    EvaluationSchedule[]
  >(cycle?.ListEvaluationSchedule || []);

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

  // --- Fetch user options via TanStack Query ---
  const { data: userResponse } = useQuery({
    queryKey: ["users", "combobox"],
    queryFn: () => userService.getAllCombobox(),
    enabled: isOpen,
  });
  const userOptions = userResponse?.Data || [];

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
      setListCouncil(cycle.ListCouncil || []);
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
        RoleId: 1,
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
    (id: string, field: keyof Council, value: string | boolean) => {
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
            <div className="col-span-6">
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

            <div className="col-span-6">
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

            <TabsContent value="council">
              <div className="grid gap-2">
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Thành viên</TableHead>
                        <TableHead className="w-[150px] text-center">
                          Vai trò
                        </TableHead>
                        <TableHead className="w-[80px] text-center">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listCouncil.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center h-24">
                            Chưa có dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        listCouncil.map((council) => (
                          <TableRow key={council.Id}>
                            <TableCell>
                              <Select
                                value={council.UserId}
                                onValueChange={(value) =>
                                  handleChangeCouncil(
                                    council.Id,
                                    "UserId",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Chọn thành viên" />
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
                              <Select
                                value={council.RoleId.toString()}
                                onValueChange={(value) =>
                                  handleChangeCouncil(
                                    council.Id,
                                    "RoleId",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">
                                    Trưởng nhóm hội đồng
                                  </SelectItem>
                                  <SelectItem value="2">
                                    Thành viên đánh giá
                                  </SelectItem>
                                  <SelectItem value="3">
                                    Người cung cấp minh chứng
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCouncil(council.Id)}
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
