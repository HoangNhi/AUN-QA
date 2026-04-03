import api, { type ApiResponse } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/constants";
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
} from "../types/sar.types";

type SaveSarDraftResponse = null;
type SubmitSarResponse = null;
type RequestSarRevisionResponse = null;
type ApproveSarResponse = null;
type AddSarFeedbackResponse = null;

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
};
