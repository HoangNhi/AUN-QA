import { Button } from "@/components/ui/Button";
import { Loader2, Edit3, Eye, ArrowLeft } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { SurveyForm } from "./components/SurveyForm";
import { v4 as uuidv4 } from "uuid";
import type {
  SurveyCampaign,
  SurveyView,
} from "../../types/survey-campaign.types";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { surveyTemplateService } from "../../api/survey-template.api";
import { TopicListEditor } from "../../components/TopicListEditor";
import { useSurveyTopics } from "../../hooks/useSurveyTopics";
import { toast } from "sonner";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";
import { CAMPAIGN_STATUS_OPTIONS } from "@/constants/business.constants";
import { cn } from "@/lib/utils";

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
  // Form state as single object for cleaner code
  const [formData, setFormData] = useState({
    id: surveyCampaign?.Id || uuidv4(),
    name: surveyCampaign?.Name || "",
    stakeholderType: surveyCampaign?.StakeholderType?.toString() || "",
    status: surveyCampaign?.Status?.toString() || "",
    cycleId: surveyCampaign?.CycleId || "",
    templateId: surveyCampaign?.TemplateId || "",
  });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const { listTopic, setListTopic, collapsedTopics, handlers } =
    useSurveyTopics(surveyCampaign?.ListTopic || []);

  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const onSubmit = (isAddMore: boolean) => {
    const payload = {
      Id: formData.id,
      Name: formData.name,
      StakeholderType: parseInt(formData.stakeholderType),
      Status: parseInt(formData.status),
      CycleId: formData.cycleId,
      TemplateId: formData.templateId,
      ListTopic: listTopic,
      IsEdit: surveyCampaign?.IsEdit || false,
    };
    saveChange(payload as SurveyCampaign & { IsEdit: boolean }, isAddMore);
  };

  useEffect(() => {
    if (surveyCampaign) {
      setFormData({
        id: surveyCampaign.Id || uuidv4(),
        name: surveyCampaign.Name || "",
        stakeholderType: surveyCampaign.StakeholderType?.toString() || "1",
        status: surveyCampaign.Status?.toString() || "0",
        cycleId: surveyCampaign.CycleId || "",
        templateId: surveyCampaign.TemplateId || "",
      });
      setListTopic(surveyCampaign?.ListTopic || []);
    }
  }, [surveyCampaign, setListTopic]);

  // Transform data for preview
  const getPreviewData = (): SurveyView => {
    return {
      Id: formData.id,
      Name: formData.name || "Tên khảo sát (Xem trước)",
      StakeholderType: parseInt(formData.stakeholderType || "1"),
      IsSessionCompleted: false,
      ListTopic:
        listTopic as unknown as import("../../types/survey-campaign.types").SurveyViewTopic[], // Casting for preview compatibility
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 w-full flex flex-col focus:outline-none overflow-hidden duration-300 transition-all",
          mode === "preview"
            ? "max-w-none w-screen h-screen rounded-none border-0 data-[state=open]:slide-in-from-bottom-0"
            : "sm:max-w-4xl max-h-[90vh]",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        style={
          mode === "preview"
            ? {
                maxWidth: "100vw",
                width: "100vw",
                height: "100vh",
              }
            : undefined
        }
      >
        <form
          className="flex flex-col w-full min-h-0 h-full"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(false);
          }}
        >
          <DialogHeader
            className={cn(
              "p-6 pb-4 border-b shrink-0 bg-white z-10 transition-all",
              mode === "preview" ? "py-4 shadow-sm" : "",
            )}
          >
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {mode === "preview" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMode("edit")}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <span>
                  {surveyCampaign?.IsEdit
                    ? "Cập nhật khảo sát"
                    : "Thêm mới khảo sát"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as "edit" | "preview")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">
                      <Edit3 size={16} className="mr-2" /> Soạn thảo
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye size={16} className="mr-2" /> Xem trước
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Edit Mode Content - Keep mounted but hide when in preview */}
          <div
            className={cn(
              "flex-1 overflow-y-auto bg-gray-50/50 p-6 min-h-0",
              mode === "preview" && "hidden",
            )}
          >
            {/* General Info Section */}
            <div className="bg-white rounded-lg border shadow-sm p-4 mb-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                <h3 className="font-semibold text-gray-700">Thông tin chung</h3>
              </div>

              <div className="grid gap-4">
                {/* Name */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="name"
                    className="after:content-['*'] after:ml-0.5 after:text-red-500"
                  >
                    Tên khảo sát
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    placeholder="Nhập tên khảo sát"
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
                        return (res.Data || []).map((t) => ({
                          Value: t.Value ?? "",
                          Text: t.Text ?? "",
                        }));
                      }}
                      value={formData.cycleId}
                      onValueChange={(val) => updateField("cycleId", val)}
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
                      options={STAKEHOLDER_TYPES}
                      value={formData.stakeholderType}
                      onValueChange={(val) => {
                        updateField("stakeholderType", val);
                        updateField("templateId", "");
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
                      key={formData.stakeholderType} // Force re-mount when stakeholder changes to fetch new options
                      fetchOptions={async () => {
                        const res = await surveyTemplateService.getAllCombobox({
                          StakeholderType: parseInt(formData.stakeholderType),
                        });
                        return (res.Data || []).map((t) => ({
                          Value: t.Value ?? "",
                          Text: t.Text ?? "",
                        }));
                      }}
                      value={formData.templateId}
                      onValueChange={async (val) => {
                        updateField("templateId", val);
                        if (val) {
                          setIsLoadingTemplate(true);
                          try {
                            const res =
                              await surveyTemplateService.getById(val);
                            if (res.Success) {
                              setListTopic(res.Data?.ListTopic || []);
                            } else {
                              setListTopic([]);
                              toast.error(res.Message);
                            }
                          } finally {
                            setIsLoadingTemplate(false);
                          }
                        } else {
                          setListTopic([]);
                        }
                      }}
                      placeholder="Chọn mẫu khảo sát"
                      searchPlaceholder="Tìm kiếm mẫu khảo sát..."
                      emptyText="Không tìm thấy mẫu khảo sát."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Trạng thái</Label>
                    <Combobox
                      options={CAMPAIGN_STATUS_OPTIONS}
                      value={formData.status}
                      onValueChange={(val) => updateField("status", val)}
                      placeholder="Chọn trạng thái"
                      searchPlaceholder="Tìm kiếm trạng thái..."
                      readonly={!surveyCampaign?.IsEdit}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-[200px]">
              {formData.templateId ? (
                isLoadingTemplate ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                    <p>Đang tải dữ liệu mẫu khảo sát...</p>
                  </div>
                ) : (
                  <TopicListEditor
                    listTopic={listTopic}
                    collapsedTopics={collapsedTopics}
                    handlers={handlers}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-48 border rounded-lg bg-gray-50 text-gray-500">
                  Vui lòng chọn Mẫu khảo sát trước.
                </div>
              )}
            </div>
          </div>

          {/* Preview Mode Content - Render conditionally but only when needed (heavy component) or keep if we want state preservation there too? 
              SurveyForm is read-only in preview, so remounting is fine/safer to ensure it gets fresh data. 
              But let's keep logic simple: Conditionally render Preview is fine, as long as Edit stays mounted.
           */}
          {mode === "preview" && (
            <div className="flex-1 overflow-y-auto bg-gray-50/50 min-h-0">
              <SurveyForm
                campaign={getPreviewData()}
                isPreview={true}
                onSubmit={() => {
                  toast.success("Đây chỉ là bản xem trước!");
                }}
              />
            </div>
          )}

          {mode === "edit" && (
            <DialogFooter className="p-6 pt-4 border-t shrink-0 bg-white z-10">
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu
              </Button>
              {!surveyCampaign?.IsEdit && (
                <Button
                  type="button"
                  onClick={() => onSubmit(true)}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Lưu và thêm tiếp
                </Button>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupSurveyCampaign;
