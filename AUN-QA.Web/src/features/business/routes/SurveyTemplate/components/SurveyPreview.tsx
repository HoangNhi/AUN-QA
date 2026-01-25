import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ChevronRight, ListChecks } from "lucide-react";
import type { TemplateTopic } from "../../../types/survey-template.types";

interface SurveyPreviewProps {
  title: string;
  description: string;
  stakeholderType: string;
  listTopic: TemplateTopic[];
}

const SCALE_LABELS: Record<number, string> = {
  1: "Hoàn toàn không đồng ý",
  2: "Không đồng ý",
  3: "Trung lập",
  4: "Đồng ý",
  5: "Hoàn toàn đồng ý",
};

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

  const getStakeholderLabel = (type: string) => {
    switch (type) {
      case "1":
        return "Sinh viên";
      case "2":
        return "Cựu sinh viên";
      case "3":
        return "Nhà tuyển dụng";
      case "4":
        return "Giảng viên";
      default:
        return "Khác";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 min-h-0">
      <div className="max-w-4xl mx-auto py-8 px-4 font-sans">
        {/* Header Section */}
        <div className="bg-white rounded-t-xl p-6 pb-0 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
              <p className="text-gray-500 text-sm">
                Đối tượng: {getStakeholderLabel(stakeholderType)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Trang {currentPreviewTopicIndex + 1} / {totalTopics}
              </p>
              <p className="text-xs text-gray-400">
                {Math.round(progress)}% hoàn thành
              </p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Introduction / Topic Header */}
        {currentTopic && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 pt-0 animate-fade-in-up">
            {/* Part Label */}
            <div className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-md mb-4 mt-6">
              Phần {currentPreviewTopicIndex + 1}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {currentTopic.Title}
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {description}
            </p>

            <div className="space-y-10">
              {currentTopic.ListCategory.map((cat, catIndex) => (
                <div key={cat.Id}>
                  {/* Category Title if needed, usually just list questions */}
                  {cat.Name && (
                    <h3 className="font-semibold text-gray-800 mb-6 text-lg border-l-4 border-blue-500 pl-3">
                      {cat.Name}
                    </h3>
                  )}

                  <div className="space-y-12">
                    {cat.ListQuestion.map((q, qIndex) => (
                      <div key={q.Id} className="space-y-4">
                        <p className="font-medium text-gray-800 text-base">
                          {catIndex + 1}.{qIndex + 1} {q.Content}{" "}
                          <span className="text-red-500">*</span>
                        </p>

                        {/* Scale 1-5 UI */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <label
                              key={val}
                              className="relative flex sm:flex-col items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                            >
                              <input
                                type="radio"
                                name={q.Id}
                                className="w-5 h-5 border-gray-300 text-blue-600 focus:ring-blue-500 mb-0 sm:mb-2 accent-blue-600"
                              />
                              <span className="mx-3 sm:mx-0 font-bold text-gray-700 group-hover:text-blue-700">
                                {val}
                              </span>
                              <span className="text-[10px] sm:text-xs text-center text-gray-500 group-hover:text-gray-700 leading-tight">
                                {SCALE_LABELS[val]}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Legend for mobile mainly or visual aid */}
                        <div className="flex justify-between text-xs text-gray-400 px-1 pt-1 opacity-60">
                          <span>Hoàn toàn không đồng ý</span>
                          <span>Hoàn toàn đồng ý</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Open Ended Questions */}
              {currentTopic.HasTextQuestionPart && (
                <div className="pt-8 mt-8 border-t border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-6 text-lg">
                    {currentTopic.TextQuestionTitle || "Ý kiến bổ sung"}
                  </h4>
                  <div className="space-y-8">
                    {currentTopic.ListTextQuestion.map((q, index) => (
                      <div key={q.Id} className="space-y-3">
                        <label className="font-medium text-gray-800 text-base block">
                          {index + 1}. {q.Content}
                          {q.IsRequired && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full border border-gray-300 rounded-md p-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
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

        {/* Footer Navigation */}
        <div className="flex justify-between items-center mt-8">
          {/* Previous Button */}
          <Button
            type="button"
            onClick={() =>
              setCurrentPreviewTopicIndex((p) => Math.max(0, p - 1))
            }
            disabled={currentPreviewTopicIndex === 0}
            variant="ghost"
            className={`text-gray-500 hover:text-gray-900 hover:bg-gray-100 ${
              currentPreviewTopicIndex === 0
                ? "opacity-0 pointer-events-none"
                : ""
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>

          {/* Next/Submit Button */}
          {currentPreviewTopicIndex < totalTopics - 1 ? (
            <Button
              type="button"
              onClick={() =>
                setCurrentPreviewTopicIndex((p) =>
                  Math.min(totalTopics - 1, p + 1),
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              Tiếp theo <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              onClick={() => alert("Đây chỉ là bản xem trước!")}
            >
              Gửi Kết Quả <ListChecks className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
