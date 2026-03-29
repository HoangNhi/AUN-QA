import api, { type ApiResponse } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/constants";
import type { GetListPagingResponse } from "@/types/base/base.types";
import type {
  GetSarByCycleRequest,
  SarDraft,
  SarGetListItem,
  SarGetListPagingRequest,
  SaveSarDraftRequest,
} from "../types/sar.types";

type SaveSarDraftResponse = null;

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
};
