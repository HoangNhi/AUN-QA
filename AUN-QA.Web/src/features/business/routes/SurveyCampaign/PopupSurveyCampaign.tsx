import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { SurveyCampaign } from "../../types/survey-campaign.types";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { surveyTemplateService } from "../../api/survey-template.api";

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
      setStakeholderType("");
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
        className="sm:max-w-4xl max-h-[90vh] p-0 gap-0 w-full flex flex-col focus:outline-none overflow-hidden"
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
                  <Combobox
                    fetchOptions={async () => {
                      const res = await cycleService.getComboboxByUser();
                      return res.Data.map((t) => ({
                        value: t.Value ?? "",
                        label: t.Text ?? "",
                      }));
                    }}
                    value={cycleId}
                    onValueChange={setCycleId}
                    placeholder="Chọn chu kỳ"
                    searchPlaceholder="Tìm kiếm chu kỳ..."
                    emptyText="Không tìm thấy chu kỳ."
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Loại đối tượng
                  </Label>
                  <Combobox
                    options={[
                      { Value: "1", Text: "Sinh viên" },
                      { Value: "2", Text: "Cựu sinh viên" },
                      { Value: "3", Text: "Nhà tuyển dụng" },
                      { Value: "4", Text: "Giảng viên" },
                    ]}
                    value={stakeholderType}
                    onValueChange={(val) => {
                      setStakeholderType(val);
                      setTemplateId(""); // Reset template when stakeholder changes
                    }}
                    placeholder="Chọn đối tượng"
                    searchPlaceholder="Tìm kiếm đối tượng..."
                    emptyText="Không tìm thấy đối tượng."
                  />
                </div>
              </div>

              {/* Template & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Mẫu khảo sát
                  </Label>
                  <Combobox
                    key={stakeholderType} // Force re-mount when stakeholder changes to fetch new options
                    fetchOptions={async () => {
                      const res = await surveyTemplateService.getAllCombobox({
                        StakeholderType: parseInt(stakeholderType),
                      });
                      return res.Data.map((t) => ({
                        Value: t.Value ?? "",
                        Text: t.Text ?? "",
                      }));
                    }}
                    value={templateId}
                    onValueChange={setTemplateId}
                    placeholder="Chọn mẫu khảo sát"
                    searchPlaceholder="Tìm kiếm mẫu khảo sát..."
                    emptyText="Không tìm thấy mẫu khảo sát."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Trạng thái</Label>
                  <Combobox
                    options={[
                      { Value: "0", Text: "Chưa bắt đầu" },
                      { Value: "1", Text: "Đang diễn ra" },
                      { Value: "2", Text: "Đã kết thúc" },
                    ]}
                    value={status}
                    onValueChange={setStatus}
                    placeholder="Chọn trạng thái"
                    searchPlaceholder="Tìm kiếm trạng thái..."
                    emptyText="Không tìm thấy trạng thái."
                  />
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
