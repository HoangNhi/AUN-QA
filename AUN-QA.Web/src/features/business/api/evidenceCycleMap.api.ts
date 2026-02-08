import api, { type ApiResponse } from "@/lib/api";
import type { EvidenceCycleMap } from "@/features/business/types/evidence.types";
import type { GetListPagingRequest, GetListPagingResponse, ModelCombobox } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";

export const evidenceCycleMapService = {
  getList: async (request: GetListPagingRequest): Promise<ApiResponse<GetListPagingResponse<EvidenceCycleMap>>> => {
    return api.post<GetListPagingResponse<EvidenceCycleMap>>(API_ENDPOINTS.Business.EvidenceCycleMap.GET_LIST, request);
  },

  getById: async (id: string): Promise<ApiResponse<EvidenceCycleMap>> => {
    return api.get<EvidenceCycleMap>(API_ENDPOINTS.Business.EvidenceCycleMap.GET_BY_ID, { params: { id } });
  },

  insert: async (data: EvidenceCycleMap): Promise<ApiResponse<EvidenceCycleMap>> => {
    return api.post<EvidenceCycleMap>(API_ENDPOINTS.Business.EvidenceCycleMap.INSERT, data);
  },

  update: async (data: EvidenceCycleMap): Promise<ApiResponse<EvidenceCycleMap>> => {
    return api.put<EvidenceCycleMap>(API_ENDPOINTS.Business.EvidenceCycleMap.UPDATE, data);
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<string>> => {
    return api.delete<string>(API_ENDPOINTS.Business.EvidenceCycleMap.DELETE_LIST, { data: { ids } });
  },

  getAllCombobox: async (): Promise<ApiResponse<ModelCombobox[]>> => {
      return api.get<ModelCombobox[]>(API_ENDPOINTS.Business.EvidenceCycleMap.GET_ALL_COMBOBOX);
  }
};
