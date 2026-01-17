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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { SurveyCampaign } from "../../types/survey-campaign.types";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { surveyTemplateService } from "../../api/survey-template.api"; // Ensure this exists or adapt
import type { ModelCombobox } from "@/types/base/base.types";

const PopupSurveyCampaign = ({
  surveyCampaign,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: {
  surveyCampaign: SurveyCampaign | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (
    data: SurveyCampaign & { IsEdit: boolean },
    isAddMore: boolean,
  ) => void;
  isLoading?: boolean;
}) => {
  const [id, setId] = useState<string>(surveyCampaign?.Id || uuidv4());
  const [name, setName] = useState(surveyCampaign?.Name || "");
  const [stakeholderType, setStakeholderType] = useState(
    surveyCampaign?.StakeholderType?.toString() || "1",
  );
  const [status, setStatus] = useState(
    surveyCampaign?.Status?.toString() || "0",
  );
  const [cycleId, setCycleId] = useState(surveyCampaign?.CycleId || "");
  const [templateId, setTemplateId] = useState(
    surveyCampaign?.TemplateId || "",
  );
  const [isActived, setIsActived] = useState(surveyCampaign?.IsActived ?? true);

  // Dropdown Data
  const [cycles, setCycles] = useState<ModelCombobox[]>([]);
  const [openCycle, setOpenCycle] = useState(false);
  const [templates, setTemplates] = useState<ModelCombobox[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
    }
  }, [isOpen]);

  const fetchDropdowns = async () => {
    setLoadingDropdowns(true);
    try {
      // Fetch Cycles (using getList as combobox)
      const cyclesRes = await cycleService.getList({
        PageIndex: 1,
        PageSize: 100,
        TextSearch: "",
      });
      if (cyclesRes.Data?.Data) {
        setCycles(
          cyclesRes.Data.Data.map((c: any) => ({ Text: c.Name, Value: c.Id })),
        );
      }

      // Fetch Templates
      const templatesRes = await surveyTemplateService.getAllCombobox();
      if (templatesRes.Data) {
        setTemplates(templatesRes.Data);
      }
    } catch (e) {
      console.error("Error fetching dropdowns", e);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    if (surveyCampaign) {
      setId(surveyCampaign.Id || uuidv4());
      setName(surveyCampaign.Name || "");
      setStakeholderType(surveyCampaign.StakeholderType?.toString() || "1");
      setStatus(surveyCampaign.Status?.toString() || "0");
      setCycleId(surveyCampaign.CycleId || "");
      setTemplateId(surveyCampaign.TemplateId || "");
      setIsActived(surveyCampaign.IsActived ?? true);
    } else {
      // Reset form
      setId(uuidv4());
      setName("");
      setStakeholderType("1");
      setStatus("0");
      setCycleId("");
      setTemplateId("");
      setIsActived(true);
    }
  }, [surveyCampaign, isOpen]);

  const handleSave = (isAddMore: boolean) => {
    const payload = {
      Id: id,
      Name: name,
      StakeholderType: parseInt(stakeholderType),
      Status: parseInt(status),
      CycleId: cycleId,
      TemplateId: templateId,
      IsActived: isActived,
      ListSession: [], // Should probably handle these if editing existing ones, but likely handled by backend or separate tab
      ListScore: [],
      ListTextAnswer: [],
      IsEdit: (surveyCampaign as any)?.IsEdit || false,
      CreatedAt: surveyCampaign?.CreatedAt || new Date().toISOString(),
      CreatedBy: surveyCampaign?.CreatedBy || "",
      IsDeleted: false,
    };

    saveChange(payload as any, isAddMore);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 w-full flex flex-col focus:outline-none overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="flex flex-col w-full min-h-0 h-full"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
        >
          <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-white z-10">
            <DialogTitle>
              {(surveyCampaign as any)?.IsEdit
                ? "Cập nhật chiến dịch khảo sát"
                : "Thêm mới chiến dịch khảo sát"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 min-h-0">
            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label
                  htmlFor="name"
                  className="after:content-['*'] after:ml-0.5 after:text-red-500"
                >
                  Tên chiến dịch
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nhập tên chiến dịch"
                  className="bg-white"
                />
              </div>

              {/* Cycle & Stakeholder */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Chu kỳ đánh giá
                  </Label>
                  <Popover open={openCycle} onOpenChange={setOpenCycle}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCycle}
                        className="w-full justify-between bg-white font-normal"
                      >
                        {cycleId
                          ? cycles.find((cycle) => cycle.Value === cycleId)
                              ?.Text
                          : "Chọn chu kỳ"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm chu kỳ..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy chu kỳ.</CommandEmpty>
                          <CommandGroup>
                            {cycles.map((cycle) => (
                              <CommandItem
                                key={cycle.Value}
                                value={cycle.Text} // Use Text for search filtering
                                onSelect={() => {
                                  setCycleId(cycle.Value);
                                  setOpenCycle(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    cycleId === cycle.Value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {cycle.Text}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Loại đối tượng
                  </Label>
                  <Select
                    value={stakeholderType}
                    onValueChange={setStakeholderType}
                    required
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Chọn đối tượng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sinh viên</SelectItem>
                      <SelectItem value="2">Cựu sinh viên</SelectItem>
                      <SelectItem value="3">Nhà tuyển dụng</SelectItem>
                      <SelectItem value="4">Giảng viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Mẫu khảo sát
                  </Label>
                  <Select
                    value={templateId}
                    onValueChange={setTemplateId}
                    required
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Chọn mẫu khảo sát" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingDropdowns ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="animate-spin h-4 w-4" />
                        </div>
                      ) : (
                        templates.map((item) => (
                          <SelectItem key={item.Value} value={item.Value}>
                            {item.Text}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Trạng thái</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Chưa bắt đầu</SelectItem>
                      <SelectItem value="1">Đang diễn ra</SelectItem>
                      <SelectItem value="2">Đã kết thúc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t shrink-0 bg-white z-10">
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
            {!(surveyCampaign as any)?.IsEdit && (
              <Button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu và thêm tiếp
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupSurveyCampaign;
