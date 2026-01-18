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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Edit3, Eye } from "lucide-react";
import { SurveyPreview } from "./components/SurveyPreview";
import { TopicListEditor } from "../../components/TopicListEditor";
import { useSurveyTopics } from "../../hooks/useSurveyTopics";
import type { SurveyTemplate } from "../../types/survey-template.types";

const PopupSurveyTemplate = ({
  surveyTemplate,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: {
  surveyTemplate: SurveyTemplate | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (
    data: SurveyTemplate & { IsEdit: boolean },
    isAddMore: boolean,
  ) => void;
  isLoading?: boolean;
}) => {
  const [id, setId] = useState<string>(surveyTemplate?.Id || uuidv4());
  const [title, setTitle] = useState(surveyTemplate?.Title || "");
  const [stakeholderType, setStakeholderType] = useState(
    surveyTemplate?.StakeholderType?.toString() || "1",
  );
  const [description, setDescription] = useState(
    surveyTemplate?.Description || "",
  );
  const [isActived, setIsActived] = useState(surveyTemplate?.IsActived ?? true);

  const { listTopic, setListTopic, collapsedTopics, handlers } =
    useSurveyTopics(surveyTemplate?.ListTopic || []);

  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const handleSave = (isAddMore: boolean) => {
    const payload = {
      Id: id,
      Title: title,
      StakeholderType: parseInt(stakeholderType),
      Description: description,
      IsActived: isActived,
      ListTopic: listTopic,
      IsEdit: (surveyTemplate as any)?.IsEdit || false,
    };

    saveChange(payload, isAddMore);
  };

  const handleModeChange = (newMode: "edit" | "preview") => {
    setMode(newMode);
  };

  const renderEditor = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 min-h-0">
        <div className="pb-6">
          <div className="grid gap-4 pb-6 grid-cols-2">
            <div className="grid gap-2 col-span-2">
              <Label
                htmlFor="title"
                className="after:content-['*'] after:ml-0.5 after:text-red-500"
              >
                Tiêu đề
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nhập tiêu đề"
                className="bg-white"
              />
            </div>

            <div className="col-span-2 grid gap-2 grid-cols-2 items-start">
              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Nhập mô tả"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] bg-white resize-y"
                />
              </div>
              <div className="grid gap-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="stakeholderType"
                    className="after:content-['*'] after:ml-0.5 after:text-red-500"
                  >
                    Loại đối tượng
                  </Label>
                  <Select
                    value={stakeholderType}
                    onValueChange={setStakeholderType}
                  >
                    <SelectTrigger
                      id="stakeholderType"
                      className="w-full bg-white"
                    >
                      <SelectValue placeholder="Chọn loại đối tượng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sinh viên</SelectItem>
                      <SelectItem value="2">Cựu sinh viên</SelectItem>
                      <SelectItem value="4">Giảng viên</SelectItem>
                      <SelectItem value="3">Nhà tuyển dụng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label>Trạng thái</Label>
                  <Select
                    value={isActived ? "true" : "false"}
                    onValueChange={(value) =>
                      setIsActived(value === "true" ? true : false)
                    }
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Không hoạt động</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <TopicListEditor
            listTopic={listTopic}
            collapsedTopics={collapsedTopics}
            handlers={handlers}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (surveyTemplate) {
      setId(surveyTemplate.Id || uuidv4());
      setTitle(surveyTemplate.Title || "");
      setStakeholderType(surveyTemplate.StakeholderType?.toString() || "1");
      setDescription(surveyTemplate.Description || "");
      setIsActived(surveyTemplate.IsActived ?? true);
      setListTopic(surveyTemplate.ListTopic || []);
    }
  }, [surveyTemplate]);

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
            <DialogTitle className="flex items-center justify-between">
              {(surveyTemplate as any)?.IsEdit
                ? "Cập nhật mẫu khảo sát"
                : "Thêm mới mẫu khảo sát"}

              <div className="flex items-center gap-3">
                <Tabs
                  value={mode}
                  onValueChange={(v) =>
                    handleModeChange(v as "edit" | "preview")
                  }
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

          {mode === "edit" ? (
            renderEditor()
          ) : (
            <SurveyPreview
              title={title}
              description={description}
              stakeholderType={stakeholderType}
              listTopic={listTopic}
            />
          )}

          <DialogFooter className="p-6 pt-4 border-t shrink-0 bg-white z-10">
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
            {!(surveyTemplate as any)?.IsEdit && (
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

export default PopupSurveyTemplate;
