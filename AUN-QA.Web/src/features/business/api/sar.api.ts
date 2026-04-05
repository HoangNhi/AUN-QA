import api, { API_BASE_URL, type ApiResponse } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/constants";
import { getAccessToken } from "@/lib/cookies";
import type { GetListPagingResponse } from "@/types/base/base.types";
import type {
  AddSarFeedbackRequest,
  ApproveSarRequest,
  GetSarFeedbackRequest,
  GetSarByCycleRequest,
  SarDraft,
  SarFeedback,
  SarGetListItem,
  SarGetListPagingRequest,
  SaveSarDraftRequest,
  RequestSarRevisionRequest,
  SubmitSarRequest,
  GetSarAutofillPayloadRequest,
  SarAutofillPayloadDto,
  ExportSarDocxRequest,
} from "../types/sar.types";

type SaveSarDraftResponse = null;
type SubmitSarResponse = null;
type RequestSarRevisionResponse = null;
type ApproveSarResponse = null;
type AddSarFeedbackResponse = null;

const SAR_ERROR_TRANSLATIONS: Array<{ match: RegExp; vi: string }> = [
  { match: /SAR is not in a valid state for save draft/i, vi: "Không thể lưu vì báo cáo SAR không còn ở trạng thái cho phép chỉnh sửa." },
  { match: /SAR is not in a valid state for submit/i, vi: "Không thể gửi duyệt vì báo cáo SAR không còn ở trạng thái hợp lệ." },
  { match: /SAR is not in a valid state for request revision/i, vi: "Không thể yêu cầu chỉnh sửa vì báo cáo SAR không ở trạng thái hợp lệ." },
  { match: /SAR is not in a valid state for approve/i, vi: "Không thể phê duyệt vì báo cáo SAR không ở trạng thái hợp lệ." },
  { match: /SAR is approved and read-only/i, vi: "Báo cáo SAR đã được phê duyệt và chỉ cho phép xem." },
  { match: /SAR must not be in Draft status to export/i, vi: "Chỉ có thể xuất file khi SAR đã được nộp." },
  { match: /Cycle does not exist/i, vi: "Chu kỳ không tồn tại." },
  { match: /You do not have permission to perform this action in this PDCA cycle/i, vi: "Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA hiện tại." },
  { match: /You do not have permission to request SAR revision/i, vi: "Bạn không có quyền yêu cầu chỉnh sửa SAR." },
  { match: /You do not have permission to approve SAR/i, vi: "Bạn không có quyền phê duyệt SAR." },
  { match: /Workflow action requires cycle in Check stage/i, vi: "Thao tác này yêu cầu chu kỳ đang ở giai đoạn Check." },
  { match: /HTTP 40\\d|HTTP 50\\d/i, vi: "Có lỗi kết nối máy chủ. Vui lòng thử lại." },
];

export function toVietnameseSarMessage(
  message?: string | null,
  fallback = "Đã xảy ra lỗi trong chức năng SAR.",
): string {
  const normalized = (message ?? "").trim();
  if (!normalized) {
    return fallback;
  }

  for (const item of SAR_ERROR_TRANSLATIONS) {
    if (item.match.test(normalized)) {
      return item.vi;
    }
  }

  // If backend returns an unmapped English message, keep UX in Vietnamese.
  const hasVietnameseDiacritics = /[À-ỹà-ỹĂăÂâĐđÊêÔôƠơƯư]/u.test(normalized);
  if (!hasVietnameseDiacritics) {
    return fallback;
  }

  return normalized;
}

export const sarService = {
  getList: async (
    request: SarGetListPagingRequest,
  ): Promise<ApiResponse<GetListPagingResponse<SarGetListItem>>> => {
    return api.post<GetListPagingResponse<SarGetListItem>>(
      API_ENDPOINTS.Business.Sar.GET_LIST,
      request,
    );
  },

  getByCycle: async (
    request: GetSarByCycleRequest,
  ): Promise<ApiResponse<SarDraft>> => {
    return api.post<SarDraft>(API_ENDPOINTS.Business.Sar.GET_BY_CYCLE, request);
  },

  saveDraft: async (
    request: SaveSarDraftRequest,
  ): Promise<ApiResponse<SaveSarDraftResponse>> => {
    return api.post<SaveSarDraftResponse>(
      API_ENDPOINTS.Business.Sar.SAVE_DRAFT,
      request,
    );
  },

  submit: async (request: SubmitSarRequest): Promise<ApiResponse<SubmitSarResponse>> => {
    return api.post<SubmitSarResponse>(API_ENDPOINTS.Business.Sar.SUBMIT, request);
  },

  requestRevision: async (
    request: RequestSarRevisionRequest,
  ): Promise<ApiResponse<RequestSarRevisionResponse>> => {
    return api.post<RequestSarRevisionResponse>(
      API_ENDPOINTS.Business.Sar.REQUEST_REVISION,
      request,
    );
  },

  approve: async (request: ApproveSarRequest): Promise<ApiResponse<ApproveSarResponse>> => {
    return api.post<ApproveSarResponse>(API_ENDPOINTS.Business.Sar.APPROVE, request);
  },

  getFeedbacks: async (
    request: GetSarFeedbackRequest,
  ): Promise<ApiResponse<SarFeedback[]>> => {
    return api.post<SarFeedback[]>(API_ENDPOINTS.Business.Sar.GET_FEEDBACKS, request);
  },

  addFeedback: async (
    request: AddSarFeedbackRequest,
  ): Promise<ApiResponse<AddSarFeedbackResponse>> => {
    return api.post<AddSarFeedbackResponse>(
      API_ENDPOINTS.Business.Sar.ADD_FEEDBACK,
      request,
    );
  },

  getAutofillPayload: async (
    request: GetSarAutofillPayloadRequest,
  ): Promise<ApiResponse<SarAutofillPayloadDto>> => {
    return api.post<SarAutofillPayloadDto>(
      API_ENDPOINTS.Business.Sar.GET_AUTOFILL_PAYLOAD,
      request,
    );
  },

  exportDocx: async (
    request: ExportSarDocxRequest,
  ): Promise<Blob> => {
    const token = getAccessToken();
    const endpoint = new URL(
      API_ENDPOINTS.Business.Sar.EXPORT_DOCX,
      `${API_BASE_URL}/`,
    ).toString();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        toVietnameseSarMessage(message, `Xuất DOCX thất bại (HTTP ${response.status})`),
      );
    }

    return response.blob();
  },
};
