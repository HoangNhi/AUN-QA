import api, { type ApiResponse } from "@/lib/api";
import type { Evidence } from "@/features/business/types/evidence.types";
import type { GetListPagingRequest, GetListPagingResponse, ModelCombobox } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";

export const evidenceService = {
  getList: async (request: GetListPagingRequest): Promise<ApiResponse<GetListPagingResponse<Evidence>>> => {
    return api.post<GetListPagingResponse<Evidence>>(API_ENDPOINTS.Business.Evidence.GET_LIST, request);
  },

  getById: async (id: string): Promise<ApiResponse<Evidence>> => {
    return api.get<Evidence>(API_ENDPOINTS.Business.Evidence.GET_BY_ID, { params: { id } });
  },

  insert: async (data: Evidence): Promise<ApiResponse<Evidence>> => {
    return api.post<Evidence>(API_ENDPOINTS.Business.Evidence.INSERT, data);
  },

  update: async (data: Evidence): Promise<ApiResponse<Evidence>> => {
    return api.put<Evidence>(API_ENDPOINTS.Business.Evidence.UPDATE, data);
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<string>> => {
    return api.delete<string>(API_ENDPOINTS.Business.Evidence.DELETE_LIST, { data: { ids } });
  },
  
  getAllCombobox: async (): Promise<ApiResponse<ModelCombobox[]>> => {
      return api.get<ModelCombobox[]>(API_ENDPOINTS.Business.Evidence.GET_ALL_COMBOBOX);
  }
};
