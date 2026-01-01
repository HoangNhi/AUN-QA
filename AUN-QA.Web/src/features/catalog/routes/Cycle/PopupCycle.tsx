import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Council, Cycle } from "@/features/catalog/types/cycle.types";
import { userService } from "@/features/system/api/user.api";
import type { ModelCombobox } from "@/types/base/base.types";
import { format } from "date-fns";
import { Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupCycle = ({
  cycle,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  cycle: Cycle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (cycle: Cycle, isAddMore: boolean) => void;
}) => {
  const [id] = useState<string | null>(cycle?.Id || uuidv4());
  const [name, setName] = useState(cycle?.Name || "");
  const [year, setYear] = useState(
    cycle?.Year?.toString() || new Date().getFullYear().toString()
  );
  const [startDate, setStartDate] = useState(
    cycle?.StartDate
      ? format(new Date(cycle.StartDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    cycle?.EndDate
      ? format(new Date(cycle.EndDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [status, setStatus] = useState(cycle?.Status.toString() || "1");
  const [evaluationPurpose, setEvaluationPurpose] = useState(
    cycle?.EvaluationPurpose || ""
  );
  const [scope, setScope] = useState(cycle?.Scope?.toString() || "1");
  const [listCouncil, setListCouncil] = useState<Council[]>(
    cycle?.ListCouncil || []
  );

  const [userOptions, setUserOptions] = useState<ModelCombobox[]>([]);
  useEffect(() => {
    if (isOpen) {
      const fetchUserOptions = async () => {
        const res = await userService.getAllCombobox();
        if (res.Success && res.Data) {
          setUserOptions(res.Data);
        }
      };
      fetchUserOptions();
    }
  }, [isOpen]);

  const [isActived] = useState<boolean>(cycle?.IsActived ?? true);

  const handleAddCouncil = () => {
    setListCouncil([
      ...listCouncil,
      {
        Id: uuidv4(),
        CycleId: id || "",
        UserId: "",
        IsLeader: false,
        IsActived: true,
        IsEdit: false,
        FolderUpload: "",
      },
    ]);
  };

  const handleDeleteCouncil = (id: string) => {
    setListCouncil(listCouncil.filter((x) => x.Id !== id));
  };

  const handleChangeCouncil = (
    id: string,
    field: keyof Council,
    value: string | boolean
  ) => {
    setListCouncil(
      listCouncil.map((c) => (c.Id === id ? { ...c, [field]: value } : c))
    );
  };

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id || uuidv4(),
        Name: name,
        Year: parseInt(year),
        StartDate: startDate,
        EndDate: endDate,
        Status: status,
        EvaluationPurpose: evaluationPurpose,
        Scope: parseInt(scope),
        IsEdit: cycle?.IsEdit || false,
        IsActived: isActived,
        FolderUpload: cycle?.FolderUpload || "",
        ListCouncil: listCouncil,
        ListEvaluationSchedule: [],
      },
      isAddMore
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {cycle?.IsEdit ? "Cập nhật kế hoạch" : "Thêm mới kế hoạch"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 grid gap-2">
              <Label>Kế hoạch</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 col-span-6">
              <Label>Năm</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 col-span-6">
              <Label>Ngày bắt đầu</Label>
              <DatePicker
                className="w-full"
                value={startDate ? new Date(startDate) : undefined}
                onChange={(date) =>
                  setStartDate(date ? format(date, "yyyy-MM-dd") : "")
                }
              />
            </div>
            <div className="grid gap-2 col-span-6">
              <Label>Ngày kết thúc</Label>
              <DatePicker
                className="w-full"
                value={endDate ? new Date(endDate) : undefined}
                onChange={(date) =>
                  setEndDate(date ? format(date, "yyyy-MM-dd") : "")
                }
              />
            </div>
            <div className="grid gap-2 col-span-4">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Lập kế hoạch</SelectItem>
                  <SelectItem value="2">Đang diễn ra</SelectItem>
                  <SelectItem value="3">Đã kết thúc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 col-span-4">
              <Label>Phạm vi</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn phạm vi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Cấp chương trình</SelectItem>
                  <SelectItem value="2">Cấp cơ sở</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="purpose" className="grid gap-2 col-span-12">
              <TabsList>
                <TabsTrigger value="purpose">Mục đích đánh giá</TabsTrigger>
                <TabsTrigger value="council">Hội đồng</TabsTrigger>
                <TabsTrigger value="schedule">Thời gian biểu</TabsTrigger>
              </TabsList>
              <TabsContent value="purpose">
                <div className="grid gap-2 col-span-12">
                  <Label>Mục đích đánh giá</Label>
                  <Textarea
                    placeholder="Nhập mục đích đánh giá"
                    value={evaluationPurpose}
                    onChange={(e) => setEvaluationPurpose(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="council">
                <div className="grid gap-2 col-span-12">
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
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thành viên</TableHead>
                          <TableHead className="w-[150px] text-center">
                            Là trưởng nhóm
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
                                      value
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
                                <Checkbox
                                  checked={council.IsLeader}
                                  onCheckedChange={(checked) =>
                                    handleChangeCouncil(
                                      council.Id,
                                      "IsLeader",
                                      !!checked
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteCouncil(council.Id)
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
              <TabsContent value="schedule">
                Change your password here.
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
            {!cycle?.IsEdit && (
              <Button type="button" onClick={() => onSubmit(true)}>
                Lưu và thêm tiếp
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupCycle;
