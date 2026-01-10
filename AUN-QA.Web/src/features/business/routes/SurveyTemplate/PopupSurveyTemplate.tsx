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
import {
  Plus,
  Loader2,
  Edit3,
  Eye,
  ListChecks,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
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

  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [currentPreviewTopicIndex, setCurrentPreviewTopicIndex] = useState(0);

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

  const handleModeChange = (newMode: "edit" | "preview") => {
    setMode(newMode);
    if (newMode === "preview") {
      setCurrentPreviewTopicIndex(0);
    }
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
    );
  };

  const renderPreview = () => {
    const totalTopics = listTopic.length;
    const currentTopic = listTopic[currentPreviewTopicIndex];

    // Progress bar calculation
    const progress = ((currentPreviewTopicIndex + 1) / totalTopics) * 100;

    return (
      <div className="flex-1 overflow-y-auto bg-gray-50/50 min-h-0">
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Intro Card - Only on First Page */}
          {currentPreviewTopicIndex === 0 && (
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className="opacity-90 text-sm leading-relaxed">
                {description}
              </p>
              <div className="mt-4 flex gap-4 text-xs font-mono opacity-80 bg-blue-800/30 p-2 rounded inline-block">
                <span>Đối tượng: </span>
                {stakeholderType === "1" && <span>Sinh viên</span>}
                {stakeholderType === "2" && <span>Cựu sinh viên</span>}
                {stakeholderType === "3" && <span>Nhà tuyển dụng</span>}
                {stakeholderType === "4" && <span>Giảng viên</span>}
              </div>
            </div>
          )}

          {/* Current Topic Card */}
          {currentTopic && (
            <div
              key={currentTopic.Id}
              className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300"
            >
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-blue-800">
                  {currentTopic.Title}
                </h3>
                <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded border">
                  Trang {currentPreviewTopicIndex + 1}/{totalTopics}
                </span>
              </div>

              <div className="p-6 space-y-8">
                {/* Part I: Scale */}
                <div className="space-y-6">
                  {currentTopic.ListCategory.map((cat) => (
                    <div key={cat.Id}>
                      <h4 className="font-bold text-gray-800 mb-4 bg-blue-50/50 p-2 rounded border-l-4 border-blue-500">
                        {cat.Name}
                      </h4>
                      <div className="space-y-6 pl-2">
                        {cat.ListQuestion.map((q) => (
                          <div
                            key={q.Id}
                            className="space-y-3 pb-4 border-b border-gray-100 last:border-0"
                          >
                            <p className="text-gray-800 font-medium">
                              {q.Content}{" "}
                              <span className="text-red-500">*</span>
                            </p>
                            {/* Mock 1-5 Scale UI */}
                            <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-start sm:gap-4">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <label
                                  key={val}
                                  className="flex flex-col items-center gap-1 cursor-pointer group"
                                >
                                  <div
                                    className={`
                                               w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all
                                               ${
                                                 val === 1
                                                   ? "border-red-100 text-red-600 bg-red-50"
                                                   : ""
                                               }
                                               ${
                                                 val === 5
                                                   ? "border-green-100 text-green-600 bg-green-50"
                                                   : ""
                                               }
                                               ${
                                                 val > 1 && val < 5
                                                   ? "border-gray-200 text-gray-500"
                                                   : ""
                                               }
                                               group-hover:border-blue-500 group-hover:text-blue-600
                                            `}
                                  >
                                    {val}
                                  </div>
                                  <input
                                    type="radio"
                                    name={q.Id}
                                    className="w-4 h-4 accent-blue-600"
                                  />
                                </label>
                              ))}
                              <div className="hidden sm:flex text-[10px] text-gray-400 gap-8 italic ml-4">
                                <span>(1: Kém nhất)</span>
                                <span>(5: Tốt nhất)</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Part II: Open Ended / Text Questions */}
                {currentTopic.HasTextQuestionPart && (
                  <div className="pt-6 border-t-2 border-dashed border-gray-200">
                    <h4 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
                      <MessageSquare size={20} />
                      {currentTopic.TextQuestionTitle}
                    </h4>
                    <div className="space-y-5">
                      {currentTopic.ListTextQuestion.map((q) => (
                        <div key={q.Id} className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 block">
                            {q.Content}{" "}
                            {q.IsRequired && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <textarea
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-shadow"
                            placeholder="Nhập câu trả lời của bạn..."
                          ></textarea>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 pb-12">
            <Button
              type="button"
              onClick={() =>
                setCurrentPreviewTopicIndex((p) => Math.max(0, p - 1))
              }
              disabled={currentPreviewTopicIndex === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                currentPreviewTopicIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
              }`}
            >
              <ArrowLeft size={18} /> Quay lại
            </Button>

            {currentPreviewTopicIndex < totalTopics - 1 ? (
              <Button
                type="button"
                onClick={() =>
                  setCurrentPreviewTopicIndex((p) =>
                    Math.min(totalTopics - 1, p + 1)
                  )
                }
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
              >
                Tiếp theo <ChevronRight size={18} />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5"
                onClick={() => alert("Submit Survey!")}
              >
                Gửi Kết Quả <ListChecks size={18} />
              </Button>
            )}
          </div>
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

          {mode === "edit" ? renderEditor() : renderPreview()}

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
