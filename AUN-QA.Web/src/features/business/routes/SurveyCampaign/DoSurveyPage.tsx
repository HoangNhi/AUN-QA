import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  ChevronRight,
  ListChecks,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type {
  SurveyView, // NEW
  SurveySubmissionRequest,
} from "../../types/survey-campaign.types";
import { toast } from "sonner";
import { surveyCampaignService } from "../../api/survey-campaign.api";

export const DoSurveyPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // NEW
  const [campaign, setCampaign] = useState<SurveyView | null>(null); // CHANGED type
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  // Answers State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await surveyCampaignService.getSurveyByToken(token);
        if (res.Success && res.Data) {
          setCampaign(res.Data);

          // NEW: Pre-fill answers if any
          const newScores: Record<string, number> = {};
          const newTextAnswers: Record<string, string> = {};

          res.Data.ListTopic.forEach((topic) => {
            topic.ListCategory.forEach((cat) => {
              cat.ListQuestion.forEach((q) => {
                if (q.Score) newScores[q.Id] = q.Score;
              });
            });
            topic.ListTextQuestion.forEach((q) => {
              if (q.Answer) newTextAnswers[q.Id] = q.Answer;
            });
          });
          setScores(newScores);
          setTextAnswers(newTextAnswers);
        } else {
          toast.error(res.Message || "Không thể tải bài khảo sát");
        }
      } catch {
        toast.error("Có lỗi xảy ra khi tải bài khảo sát");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [token]);

  const handleScoreChange = (questionId: string, score: number) => {
    setScores((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleTextAnswerChange = (questionId: string, answer: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const validateCurrentTopic = () => {
    if (!campaign?.ListTopic) return false;
    const currentTopic = campaign.ListTopic[currentTopicIndex];

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
      setCurrentTopicIndex((p) =>
        Math.min((campaign?.ListTopic?.length || 1) - 1, p + 1),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentTopic()) return;
    if (!token) return;

    try {
      setIsSubmitting(true);
      const payload: SurveySubmissionRequest = {
        Token: token,
        Scores: Object.entries(scores).map(([k, v]) => ({
          QuestionId: k,
          Score: v,
        })),
        TextAnswers: Object.entries(textAnswers).map(([k, v]) => ({
          TextQuestionId: k,
          Content: v,
        })),
      };

      const res = await surveyCampaignService.submitSurvey(payload);
      if (res.Success) {
        setIsCompleted(true);
        toast.success("Gửi khảo sát thành công!");
      } else {
        toast.error(res.Message || "Gửi khảo sát thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi gửi khảo sát");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Đang tải bài khảo sát...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <ListChecks className="text-green-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Cảm ơn bạn đã tham gia!
          </h1>
          <p className="text-gray-600">
            Câu trả lời của bạn đã được ghi nhận. Những đóng góp của bạn rất
            quan trọng đối với chúng tôi.
          </p>
        </div>
      </div>
    );
  }

  if (!campaign || !campaign.ListTopic || campaign.ListTopic.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center max-w-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Không tìm thấy khảo sát
          </h1>
          <p className="text-gray-600">
            Liên kết có thể không hợp lệ hoặc khảo sát đã kết thúc.
          </p>
        </div>
      </div>
    );
  }

  // NEW: Already Responded Screen
  if (campaign.IsSessionCompleted && !isEditing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="h-2 bg-blue-600 w-full" />

          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <ListChecks className="text-blue-600 w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {campaign.Name}
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-xs">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                Đã hoàn thành
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              Cảm ơn bạn đã dành thời gian thực hiện khảo sát. <br />
              Câu trả lời của bạn đã được hệ thống ghi nhận.
            </p>

            <div className="pt-2">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold px-8"
              >
                Xem lại & Chỉnh sửa
              </Button>
            </div>

            <p className="text-xs text-gray-400 pt-4">
              Nếu bạn muốn thay đổi câu trả lời, vui lòng nhấn nút chỉnh sửa ở
              trên.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalTopics = campaign.ListTopic.length;
  const currentTopic = campaign.ListTopic[currentTopicIndex];
  const progress = ((currentTopicIndex + 1) / totalTopics) * 100;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
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
              {/* <p className="opacity-90 text-sm leading-relaxed">{description}</p> */}
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
            key={currentTopic.Id}
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
                                                 val === 1 &&
                                                 scores[q.Id] === val
                                                   ? "!bg-red-500 !border-red-500"
                                                   : ""
                                               }
                                               ${
                                                 val === 5 &&
                                                 scores[q.Id] === val
                                                   ? "!bg-green-500 !border-green-500"
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
                window.scrollTo({ top: 0, behavior: "smooth" });
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
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Gửi Kết Quả <ListChecks size={18} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
