import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  ChevronRight,
  ListChecks,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { SurveyView } from "../../../types/survey-campaign.types";
import { toast } from "sonner";

interface SurveyFormProps {
  campaign: SurveyView;
  initialScores?: Record<string, number>;
  initialTextAnswers?: Record<string, string>;
  isSubmitting?: boolean;
  onSubmit: (
    scores: Record<string, number>,
    textAnswers: Record<string, string>,
  ) => void;
  isPreview?: boolean;
}

const DEFAULT_EMPTY_OBJECT = {};

export const SurveyForm = ({
  campaign,
  initialScores = DEFAULT_EMPTY_OBJECT,
  initialTextAnswers = DEFAULT_EMPTY_OBJECT,
  isSubmitting = false,
  onSubmit,
  isPreview = false,
}: SurveyFormProps) => {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [textAnswers, setTextAnswers] =
    useState<Record<string, string>>(initialTextAnswers);

  // Update local state when initial props change (e.g. data loaded)
  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  useEffect(() => {
    setTextAnswers(initialTextAnswers);
  }, [initialTextAnswers]);

  const totalTopics = campaign.ListTopic?.length || 0;
  const currentTopic = campaign.ListTopic?.[currentTopicIndex];

  // If no topics, show empty state or return null
  if (!currentTopic) {
    return (
      <div className="text-center p-8">
        Không có nội dung khảo sát để hiển thị.
      </div>
    );
  }

  const progress =
    totalTopics > 0 ? ((currentTopicIndex + 1) / totalTopics) * 100 : 0;

  const handleScoreChange = (questionId: string, score: number) => {
    setScores((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleTextAnswerChange = (questionId: string, answer: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const validateCurrentTopic = () => {
    if (!currentTopic) return false;

    // Check scale questions
    for (const cat of currentTopic.ListCategory) {
      for (const q of cat.ListQuestion) {
        if (!scores[q.Id]) {
          toast.warning("Vui lòng trả lời đầy đủ các câu hỏi đánh giá");
          return false;
        }
      }
    }

    // Check text questions
    if (currentTopic.HasTextQuestionPart && currentTopic.ListTextQuestion) {
      for (const q of currentTopic.ListTextQuestion) {
        if (q.IsRequired && !textAnswers[q.Id]?.trim()) {
          toast.warning("Vui lòng trả lời các câu hỏi bắt buộc");
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentTopic()) {
      setCurrentTopicIndex((p) => Math.min(totalTopics - 1, p + 1));
      // Scroll inside the container if possible. For now, window scroll is safe for full page.
      // If used in popup, main container might be the scrollable one.
      // We'll rely on the parent container handling overflow, or scroll behavior logic might need adjustment.
      const scrollContainer = document.querySelector(".overflow-y-auto");
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleSubmitClick = () => {
    if (validateCurrentTopic()) {
      onSubmit(scores, textAnswers);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 font-sans">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 sticky top-0 z-10">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Intro Card - Only on First Page */}
      {currentTopicIndex === 0 && (
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-2">{campaign.Name}</h2>
          <div className="mt-4 flex gap-4 text-xs font-mono opacity-80 bg-blue-800/30 p-2 rounded inline-block">
            <span>Đối tượng: </span>
            {campaign.StakeholderType === 1 && <span>Sinh viên</span>}
            {campaign.StakeholderType === 2 && <span>Cựu sinh viên</span>}
            {campaign.StakeholderType === 3 && <span>Nhà tuyển dụng</span>}
            {campaign.StakeholderType === 4 && <span>Giảng viên</span>}
          </div>
        </div>
      )}

      {/* Current Topic Card */}
      <div
        key={currentTopic.Id || "temp-topic-id"} // key helps react remount animation
        className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300"
      >
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center sticky top-2 z-10">
          <h3 className="text-xl font-bold text-blue-800">
            {currentTopic.Title}
          </h3>
          <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded border">
            Trang {currentTopicIndex + 1}/{totalTopics}
          </span>
        </div>

        <div className="p-6 space-y-8">
          {/* Part I: Scale */}
          <div className="space-y-6">
            {currentTopic.ListCategory?.map((cat) => (
              <div key={cat.Id}>
                {cat.Name && (
                  <h4 className="font-bold text-gray-800 mb-4 bg-blue-50/50 p-2 rounded border-l-4 border-blue-500">
                    {cat.Name}
                  </h4>
                )}
                <div className="space-y-6 pl-2">
                  {cat.ListQuestion?.map((q) => (
                    <div
                      key={q.Id}
                      className="space-y-3 pb-4 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-gray-800 font-medium">
                        {q.Content} <span className="text-red-500">*</span>
                      </p>
                      {/* 1-5 Scale UI */}
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
                                             scores[q.Id] === val
                                               ? "border-blue-500 text-white bg-blue-500 scale-110"
                                               : "border-gray-200 text-gray-500 hover:border-blue-300"
                                           }
                                           ${
                                             val === 1 && scores[q.Id] === val
                                               ? "bg-red-500! border-red-500!"
                                               : ""
                                           }
                                           ${
                                             val === 5 && scores[q.Id] === val
                                               ? "bg-green-500! border-green-500!"
                                               : ""
                                           }
                                        `}
                            >
                              {val}
                            </div>
                            <input
                              type="radio"
                              name={q.Id}
                              value={val}
                              checked={scores[q.Id] === val}
                              onChange={() => handleScoreChange(q.Id, val)}
                              className="sr-only"
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
                {currentTopic.TextQuestionTitle || "Ý kiến bổ sung"}
              </h4>
              <div className="space-y-5">
                {currentTopic.ListTextQuestion?.map((q) => (
                  <div key={q.Id} className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">
                      {q.Content}{" "}
                      {q.IsRequired && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      rows={3}
                      value={textAnswers[q.Id] || ""}
                      onChange={(e) =>
                        handleTextAnswerChange(q.Id, e.target.value)
                      }
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

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 pb-12">
        <Button
          type="button"
          onClick={() => {
            setCurrentTopicIndex((p) => Math.max(0, p - 1));
            const scrollContainer = document.querySelector(".overflow-y-auto");
            if (scrollContainer) {
              scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          disabled={currentTopicIndex === 0}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
            currentTopicIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
          }`}
        >
          <ArrowLeft size={18} /> Quay lại
        </Button>

        {currentTopicIndex < totalTopics - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
          >
            Tiếp theo <ChevronRight size={18} />
          </Button>
        ) : (
          <Button
            type="button"
            className={`flex items-center gap-2 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${
              isPreview
                ? "bg-teal-600 hover:bg-teal-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={handleSubmitClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isPreview ? "Hoàn thành (Xem trước)" : "Gửi Kết Quả"}{" "}
                <ListChecks size={18} />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
