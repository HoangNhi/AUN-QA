import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  ChevronRight,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import type { TemplateTopic } from "../../../types/survey-template.types";

interface SurveyPreviewProps {
  title: string;
  description: string;
  stakeholderType: string;
  listTopic: TemplateTopic[];
}

export const SurveyPreview = ({
  title,
  description,
  stakeholderType,
  listTopic,
}: SurveyPreviewProps) => {
  const [currentPreviewTopicIndex, setCurrentPreviewTopicIndex] = useState(0);

  const totalTopics = listTopic.length;
  const currentTopic = listTopic[currentPreviewTopicIndex];

  // Progress bar calculation
  const progress =
    totalTopics > 0 ? ((currentPreviewTopicIndex + 1) / totalTopics) * 100 : 0;

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
            <p className="opacity-90 text-sm leading-relaxed">{description}</p>
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
                            {q.Content} <span className="text-red-500">*</span>
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
              onClick={() => alert("Đây chỉ là bản xem trước!")}
            >
              Gửi Kết Quả <ListChecks size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
