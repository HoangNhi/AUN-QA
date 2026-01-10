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

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, Loader2 } from "lucide-react";
import type {
  SurveyTemplate,
  TemplateTopic,
  TemplateTextQuestion,
} from "../../types/survey-template.types";
import { TopicItem } from "./components/TopicItem";

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
    isAddMore: boolean
  ) => void;
  isLoading?: boolean;
}) => {
  const [id, setId] = useState<string>(surveyTemplate?.Id || uuidv4());
  const [title, setTitle] = useState(surveyTemplate?.Title || "");
  const [stakeholderType, setStakeholderType] = useState(
    surveyTemplate?.StakeholderType?.toString() || "1"
  );
  const [description, setDescription] = useState(
    surveyTemplate?.Description || ""
  );
  const [isActived, setIsActived] = useState(surveyTemplate?.IsActived ?? true);

  const [listTopic, setListTopic] = useState<TemplateTopic[]>(
    surveyTemplate?.ListTopic || []
  );

  // State quản lý việc đóng/mở các Topic trong Editor
  const [collapsedTopics, setCollapsedTopics] = useState<
    Record<string, boolean>
  >({});

  // --- HANDLERS ---

  // Topic Handlers
  const handleAddTopic = () => {
    const newTopic: TemplateTopic = {
      Id: uuidv4(),
      Title: "Chủ đề mới (VD: Cơ sở vật chất)",
      Sort: listTopic.length + 1,
      ListCategory: [],
      HasTextQuestionPart: true,
      TextQuestionTitle: "Ý kiến khác",
      ListTextQuestion: [],
    };
    setListTopic((prev) => [...prev, newTopic]);
  };

  const toggleTopicCollapse = (id: string) => {
    setCollapsedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteTopic = (id: string) => {
    setListTopic((prev) => prev.filter((t) => t.Id !== id));
  };

  // Category Handlers
  const handleAddCategory = (topicId: string) => {
    setListTopic((prev) =>
      prev.map((t) => {
        if (t.Id !== topicId) return t;
        return {
          ...t,
          ListCategory: [
            ...t.ListCategory,
            {
              Id: uuidv4(),
              TopicId: topicId,
              Name: "Nhóm tiêu chí mới (VD: 1. Nội dung môn học)",
              Sort: t.ListCategory.length + 1,
              ListQuestion: [],
            },
          ],
        };
      })
    );
  };

  const handleDeleteCategory = (topicId: string, catId: string) => {
    setListTopic((prev) =>
      prev.map((t) =>
        t.Id === topicId
          ? {
              ...t,
              ListCategory: t.ListCategory.filter((c) => c.Id !== catId),
            }
          : t
      )
    );
  };

  // Scale Question Handlers
  const handleAddScaleQuestion = (topicId: string, catId: string) => {
    setListTopic((prev) =>
      prev.map((t) => {
        if (t.Id !== topicId) return t;
        return {
          ...t,
          ListCategory: t.ListCategory.map((c) => {
            if (c.Id !== catId) return c;
            return {
              ...c,
              ListQuestion: [
                ...c.ListQuestion,
                {
                  Id: uuidv4(),
                  CategoryId: catId,
                  Content: "",
                  Sort: c.ListQuestion.length + 1,
                },
              ],
            };
          }),
        };
      })
    );
  };

  const handleDeleteQuestion = (
    topicId: string,
    catId: string,
    qId: string
  ) => {
    setListTopic((prev) =>
      prev.map((t) =>
        t.Id === topicId
          ? {
              ...t,
              ListCategory: t.ListCategory.map((c) =>
                c.Id === catId
                  ? {
                      ...c,
                      ListQuestion: c.ListQuestion.filter((q) => q.Id !== qId),
                    }
                  : c
              ),
            }
          : t
      )
    );
  };

  // Open Ended (Text) Question Handlers
  const handleAddTextQuestion = (topicId: string) => {
    setListTopic((prev) =>
      prev.map((t) => {
        if (t.Id !== topicId) return t;
        return {
          ...t,
          ListTextQuestion: [
            ...t.ListTextQuestion,
            {
              Id: uuidv4(),
              TopicId: topicId,
              Content: "",
              Sort: t.ListTextQuestion.length + 1,
              IsRequired: false,
            },
          ],
        };
      })
    );
  };

  const handleDeleteTextQuestion = (topicId: string, qId: string) => {
    setListTopic((prev) =>
      prev.map((t) =>
        t.Id === topicId
          ? {
              ...t,
              ListTextQuestion: t.ListTextQuestion.filter((q) => q.Id !== qId),
            }
          : t
      )
    );
  };

  // Helper Handlers
  const updateTopic = <K extends keyof TemplateTopic>(
    id: string,
    field: K,
    value: TemplateTopic[K]
  ) => {
    setListTopic((prev) =>
      prev.map((t) => (t.Id === id ? { ...t, [field]: value } : t))
    );
  };

  const updateCategory = (topicId: string, catId: string, val: string) => {
    setListTopic((prev) =>
      prev.map((t) =>
        t.Id === topicId
          ? {
              ...t,
              ListCategory: t.ListCategory.map((c) =>
                c.Id === catId ? { ...c, Name: val } : c
              ),
            }
          : t
      )
    );
  };

  const updateScaleQuestion = (
    topicId: string,
    catId: string,
    qId: string,
    val: string
  ) => {
    setListTopic((prev) =>
      prev.map((t) =>
        t.Id === topicId
          ? {
              ...t,
              ListCategory: t.ListCategory.map((c) =>
                c.Id === catId
                  ? {
                      ...c,
                      ListQuestion: c.ListQuestion.map((q) =>
                        q.Id === qId ? { ...q, Content: val } : q
                      ),
                    }
                  : c
              ),
            }
          : t
      )
    );
  };

  const updateTextQuestion = <K extends keyof TemplateTextQuestion>(
    topicId: string,
    qId: string,
    field: K,
    val: TemplateTextQuestion[K]
  ) => {
    setListTopic((prev) =>
      prev.map((t) =>
        t.Id === topicId
          ? {
              ...t,
              ListTextQuestion: t.ListTextQuestion.map((q) =>
                q.Id === qId ? { ...q, [field]: val } : q
              ),
            }
          : t
      )
    );
  };

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
            <DialogTitle>
              {(surveyTemplate as any)?.IsEdit
                ? "Cập nhật mẫu khảo sát"
                : "Thêm mới mẫu khảo sát"}
            </DialogTitle>
          </DialogHeader>

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
                            <SelectItem value="false">
                              Không hoạt động
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              {/* 2. Topics List */}
              <div className="space-y-6">
                {listTopic.map((topic, tIndex) => (
                  <TopicItem
                    key={topic.Id}
                    topic={topic}
                    index={tIndex}
                    isCollapsed={!!collapsedTopics[topic.Id]}
                    onToggleCollapse={toggleTopicCollapse}
                    onDeleteTopic={handleDeleteTopic}
                    onUpdateTopic={updateTopic}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={updateCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddQuestion={handleAddScaleQuestion}
                    onUpdateQuestion={updateScaleQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onAddTextQuestion={handleAddTextQuestion}
                    onUpdateTextQuestion={updateTextQuestion}
                    onDeleteTextQuestion={handleDeleteTextQuestion}
                  />
                ))}
                <Button
                  type="button"
                  onClick={handleAddTopic}
                  variant="outline"
                  className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 font-semibold"
                >
                  <Plus size={20} className="mr-2" /> Thêm chủ đề mới
                </Button>
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
