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
import type {
  SurveyCampaign,
  SurveySession,
} from "../../types/survey-campaign.types";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { surveyTemplateService } from "../../api/survey-template.api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicListEditor } from "../../components/TopicListEditor";
import { useSurveyTopics } from "../../hooks/useSurveyTopics";
import { StakeholderSelector } from "./components/StakeholderSelector";
import { toast } from "sonner";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";

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
    surveyCampaign?.StakeholderType?.toString() || "",
  );
  const [status, setStatus] = useState(
    surveyCampaign?.Status?.toString() || "1",
  );
  const [cycleId, setCycleId] = useState(surveyCampaign?.CycleId || "");
  const [templateId, setTemplateId] = useState(
    surveyCampaign?.TemplateId || "",
  );
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const [listSession, setListSession] = useState<SurveySession[]>(
    surveyCampaign?.ListSession || [],
  );

  const [selectionMeta, setSelectionMeta] = useState<{
    isResultAll: boolean;
    excludedIds: string[];
  }>({
    isResultAll: false,
    excludedIds: [],
  });

  const { listTopic, setListTopic, collapsedTopics, handlers } =
    useSurveyTopics(surveyCampaign?.ListTopic || []);

  const handleSave = (isAddMore: boolean) => {
    const payload = {
      Id: id,
      Name: name,
      StakeholderType: parseInt(stakeholderType),
      Status: parseInt(status),
      CycleId: cycleId,
      TemplateId: templateId,
      ListTopic: listTopic,
      ListSession: selectionMeta.isResultAll
        ? []
        : listSession.map((s) => ({
            Id: s.Id || uuidv4(),
            CampaignId: id,
            StakeholderId: s.StakeholderId,
            StakeholderName: s.StakeholderName,
            StakeholderEmail: s.StakeholderEmail,
            Status: s.Status || 0,
          })),
      IsEdit: (surveyCampaign as any)?.IsEdit || false,
    };
    saveChange(payload as any, isAddMore);
  };

  useEffect(() => {
    if (surveyCampaign) {
      setId(surveyCampaign.Id || uuidv4());
      setName(surveyCampaign.Name || "");
      setStakeholderType(surveyCampaign.StakeholderType?.toString() || "1");
      setStatus(surveyCampaign.Status?.toString() || "0");
      setCycleId(surveyCampaign.CycleId || "");
      setTemplateId(surveyCampaign.TemplateId || "");
      setListTopic(surveyCampaign?.ListTopic || []);
      setListTopic(surveyCampaign?.ListTopic || []);
      setListSession(surveyCampaign?.ListSession || []);
      // Reset meta on load (assuming API doesn't return this meta yet, or defaults to manual)
      setSelectionMeta({ isResultAll: false, excludedIds: [] });
    } else {
      // Reset form
      setId(uuidv4());
      setName("");
      setStakeholderType("");
      setStatus("0");
      setCycleId("");
      setTemplateId("");
      setListTopic([]);
      setListTopic([]);
      setListSession([]);
      setSelectionMeta({ isResultAll: false, excludedIds: [] });
    }
  }, [surveyCampaign, isOpen, setListTopic]);

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
                ? "Cập nhật khảo sát"
                : "Thêm mới khảo sát"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 min-h-0">
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                        return res.Data.map((t) => ({
                          Value: t.Value ?? "",
                          Text: t.Text ?? "",
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
                      options={STAKEHOLDER_TYPES}
                      value={stakeholderType}
                      onValueChange={(val) => {
                        setStakeholderType(val);
                        setTemplateId(""); // Reset template when stakeholder changes
                        setListSession([]); // Reset sessions when type changes
                        setSelectionMeta({
                          isResultAll: false,
                          excludedIds: [],
                        }); // Reset selection
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
                      onValueChange={async (val) => {
                        setTemplateId(val);
                        if (val) {
                          setIsLoadingTemplate(true);
                          try {
                            const res =
                              await surveyTemplateService.getById(val);
                            if (res.Success) {
                              setListTopic(res.Data.ListTopic);
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
                      options={[
                        { Value: "0", Text: "Chưa bắt đầu" },
                        { Value: "1", Text: "Đang diễn ra" },
                        { Value: "2", Text: "Đã kết thúc" },
                      ]}
                      value={status}
                      onValueChange={setStatus}
                      placeholder="Chọn trạng thái"
                      searchPlaceholder="Tìm kiếm trạng thái..."
                      readonly={!surveyCampaign?.IsEdit}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Tabs defaultValue="survey" className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <TabsList className="bg-white border text-gray-500">
                    <TabsTrigger
                      value="survey"
                      className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                    >
                      Khảo sát
                    </TabsTrigger>
                    <TabsTrigger
                      value="stakeholder"
                      className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                    >
                      Người tham gia
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="survey"
                  className="mt-0 focus-visible:outline-none"
                >
                  {/* Removed max-w and overflow to allow parent to scroll */}
                  <div className="min-h-[200px]">
                    {templateId ? (
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
                </TabsContent>
                <TabsContent
                  value="stakeholder"
                  className="mt-0 focus-visible:outline-none"
                >
                  <div className="bg-white rounded-lg border p-4 min-h-[200px]">
                    <StakeholderSelector
                      stakeholderType={stakeholderType}
                      selectedSessions={listSession}
                      onSelectionChange={(sessions, meta) => {
                        setListSession(sessions);
                        if (meta) {
                          setSelectionMeta(meta);
                        }
                      }}
                      isEdit={!!surveyCampaign?.IsEdit}
                      selectionMeta={selectionMeta}
                    />
                  </div>
                </TabsContent>
              </Tabs>
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
