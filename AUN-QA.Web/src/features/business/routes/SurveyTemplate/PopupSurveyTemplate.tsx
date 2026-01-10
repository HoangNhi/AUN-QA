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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Trash2,
  Plus,
  GripVertical,
  Loader2,
  ListChecks,
  ChevronRight,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import type {
  SurveyTemplate,
  TemplateTopic,
  TemplateTextQuestion,
} from "../../types/survey-template.types";

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
              IsActived: true,
              IsEdit: false,
              FolderUpload: "",
            },
          ],
        };
      })
    );
  };

  // Helper Handlers
  const updateTopic = (id: string, field: keyof TemplateTopic, value: any) => {
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

  const updateTextQuestion = (
    topicId: string,
    qId: string,
    field: keyof TemplateTextQuestion,
    val: any
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
                  <Card
                    key={topic.Id}
                    className="overflow-hidden border-gray-200 shadow-sm p-0 gap-0"
                  >
                    {/* Topic Header */}
                    <div className="p-4 bg-blue-50/50 border-b border-gray-100 flex flex-row items-center justify-between space-y-0 text-sm group/header transition-colors hover:bg-blue-50">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTopicCollapse(topic.Id)}
                          className="text-blue-600 hover:bg-blue-100 hover:text-blue-700 h-8 w-8 shrink-0"
                        >
                          {collapsedTopics[topic.Id] ? (
                            <ChevronRight size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </Button>
                        <div className="flex-1 mr-4">
                          <Label className="text-xs font-bold text-blue-600 uppercase mb-1 block cursor-pointer">
                            Chủ đề {tIndex + 1}
                          </Label>
                          <Input
                            type="text"
                            value={topic.Title}
                            onChange={(e) =>
                              updateTopic(topic.Id, "Title", e.target.value)
                            }
                            className="w-full font-bold text-gray-800 bg-transparent border border-transparent hover:border-blue-200 hover:bg-white focus:bg-white focus:border-blue-500 px-2 py-1 h-auto text-lg rounded transition-all placeholder:text-gray-400"
                            placeholder="Nhập tên chủ đề (VD: Giảng viên)"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newTopics = listTopic.filter(
                            (t) => t.Id !== topic.Id
                          );
                          setListTopic(newTopics);
                        }}
                        className="text-gray-400 hover:text-destructive hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>

                    {/* Topic Body */}
                    {!collapsedTopics[topic.Id] && (
                      <CardContent className="p-6 space-y-8">
                        {/* --- PART 1: CATEGORIES & SCALE QUESTIONS --- */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">
                            <ListChecks size={18} className="text-blue-600" />
                            PHẦN I: CÂU HỎI ĐÁNH GIÁ (1 - 5)
                          </div>

                          {topic.ListCategory.map((cat, cIndex) => (
                            <div
                              key={cat.Id}
                              className="pl-4 border-l-2 border-gray-200 space-y-4"
                            >
                              {/* Category Header */}
                              <div className="flex items-center gap-2">
                                <GripVertical
                                  size={16}
                                  className="text-gray-300 cursor-move"
                                />
                                <Input
                                  value={cat.Name}
                                  onChange={(e) =>
                                    updateCategory(
                                      topic.Id,
                                      cat.Id,
                                      e.target.value
                                    )
                                  }
                                  className="font-semibold text-gray-700 bg-gray-50 flex-1 focus-visible:ring-blue-400"
                                  placeholder="Nhập tên nhóm tiêu chí (VD: 1. Đề cương...)"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newCats = topic.ListCategory.filter(
                                      (c) => c.Id !== cat.Id
                                    );
                                    setListTopic((prev) =>
                                      prev.map((t) =>
                                        t.Id === topic.Id
                                          ? { ...t, ListCategory: newCats }
                                          : t
                                      )
                                    );
                                  }}
                                  className="text-gray-400 hover:text-destructive h-8 w-8"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>

                              {/* Questions List */}
                              <div className="pl-6 space-y-2">
                                {cat.ListQuestion.map((q, qIndex) => (
                                  <div
                                    key={q.Id}
                                    className="flex gap-2 items-start group/q"
                                  >
                                    <span className="text-xs text-gray-400 mt-3 font-mono">
                                      {cIndex + 1}.{qIndex + 1}
                                    </span>
                                    <Textarea
                                      rows={1}
                                      value={q.Content}
                                      onChange={(e) =>
                                        updateScaleQuestion(
                                          topic.Id,
                                          cat.Id,
                                          q.Id,
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 text-sm min-h-[40px] resize-none focus-visible:ring-blue-400"
                                      placeholder="Nội dung câu hỏi đánh giá..."
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newQs = cat.ListQuestion.filter(
                                          (qu) => qu.Id !== q.Id
                                        );
                                        setListTopic((prev) =>
                                          prev.map((t) =>
                                            t.Id === topic.Id
                                              ? {
                                                  ...t,
                                                  ListCategory:
                                                    t.ListCategory.map((c) =>
                                                      c.Id === cat.Id
                                                        ? {
                                                            ...c,
                                                            ListQuestion: newQs,
                                                          }
                                                        : c
                                                    ),
                                                }
                                              : t
                                          )
                                        );
                                      }}
                                      className="h-9 w-9 text-gray-300 hover:text-destructive opacity-0 group-hover/q:opacity-100"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleAddScaleQuestion(topic.Id, cat.Id)
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-xs h-8"
                                >
                                  <Plus size={14} className="mr-1" /> Thêm câu
                                  hỏi
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAddCategory(topic.Id)}
                            className="w-full border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Plus size={16} className="mr-2" /> Thêm Nhóm Câu
                            Hỏi Mới
                          </Button>
                        </div>

                        {/* --- PART 2: TEXT QUESTIONS --- */}
                        <div className="pt-6 border-t border-gray-100 space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <MessageSquare
                                size={18}
                                className="text-orange-500"
                              />
                              PHẦN II: CÂU HỎI MỞ (TEXT)
                            </div>
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`has-text-${topic.Id}`}
                                className="text-xs text-gray-500 cursor-pointer"
                              >
                                Kích hoạt phần này?
                              </Label>
                              <Checkbox
                                id={`has-text-${topic.Id}`}
                                checked={topic.HasTextQuestionPart}
                                onCheckedChange={(checked) =>
                                  updateTopic(
                                    topic.Id,
                                    "HasTextQuestionPart",
                                    checked === true
                                  )
                                }
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </div>
                          </div>

                          {topic.HasTextQuestionPart && (
                            <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100 space-y-4">
                              <div className="flex flex-col gap-2">
                                <Label className="text-xs font-semibold text-orange-600 uppercase">
                                  Tiêu đề phần Text
                                </Label>
                                <Input
                                  type="text"
                                  value={topic.TextQuestionTitle || ""}
                                  onChange={(e) =>
                                    updateTopic(
                                      topic.Id,
                                      "TextQuestionTitle",
                                      e.target.value
                                    )
                                  }
                                  className="w-full font-semibold text-gray-700 bg-white focus-visible:ring-orange-400"
                                />
                              </div>

                              <div className="space-y-3">
                                <Label className="text-xs font-semibold text-gray-500 uppercase">
                                  Danh sách câu hỏi mở
                                </Label>
                                {topic.ListTextQuestion.map((q, idx) => (
                                  <div
                                    key={q.Id}
                                    className="flex gap-2 items-start group/fb"
                                  >
                                    <span className="text-xs text-gray-400 font-mono mt-3">
                                      {idx + 1}.
                                    </span>
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={q.Content}
                                        onChange={(e) =>
                                          updateTextQuestion(
                                            topic.Id,
                                            q.Id,
                                            "Content",
                                            e.target.value
                                          )
                                        }
                                        className="w-full text-sm focus-visible:ring-orange-400"
                                        placeholder="VD: Môn học nào không cần thiết?"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={`req-${q.Id}`}
                                          checked={q.IsRequired}
                                          onCheckedChange={(checked) =>
                                            updateTextQuestion(
                                              topic.Id,
                                              q.Id,
                                              "IsRequired",
                                              checked === true
                                            )
                                          }
                                          className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                        />
                                        <Label
                                          htmlFor={`req-${q.Id}`}
                                          className="text-xs text-gray-500 select-none cursor-pointer"
                                        >
                                          Bắt buộc
                                        </Label>
                                      </div>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newFbs =
                                          topic.ListTextQuestion.filter(
                                            (fq) => fq.Id !== q.Id
                                          );
                                        setListTopic((prev) =>
                                          prev.map((t) =>
                                            t.Id === topic.Id
                                              ? {
                                                  ...t,
                                                  ListTextQuestion: newFbs,
                                                }
                                              : t
                                          )
                                        );
                                      }}
                                      className="h-9 w-9 text-gray-300 hover:text-destructive opacity-0 group-hover/fb:opacity-100"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleAddTextQuestion(topic.Id)
                                  }
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 text-xs h-8"
                                >
                                  <Plus size={14} className="mr-1" /> Thêm câu
                                  hỏi Text
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
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
