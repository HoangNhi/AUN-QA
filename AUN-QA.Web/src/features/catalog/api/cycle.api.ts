import api, { type ApiResponse } from "@/lib/api";
import type { GetListPagingResponse } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";
import type { Cycle, CycleGetListPagingRequest } from "../types/cycle.types";

export const cycleService = {
  getList: async (
    request: CycleGetListPagingRequest
  ): Promise<ApiResponse<GetListPagingResponse<Cycle>>> => {
    return api.post<GetListPagingResponse<Cycle>>(
      API_ENDPOINTS.Catalog.Cycle.GET_LIST,
      request
    );
  },

  getById: async (id: string): Promise<ApiResponse<Cycle>> => {
    return api.get<Cycle>(API_ENDPOINTS.Catalog.Cycle.GET_BY_ID, {
      params: { id },
    });
  },

  insert: async (data: Cycle): Promise<ApiResponse<Cycle>> => {
    return api.post<Cycle>(API_ENDPOINTS.Catalog.Cycle.INSERT, data);
  },

  update: async (data: Cycle): Promise<ApiResponse<Cycle>> => {
    return api.put<Cycle>(API_ENDPOINTS.Catalog.Cycle.UPDATE, data);
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<string>> => {
    return api.delete<string>(API_ENDPOINTS.Catalog.Cycle.DELETE_LIST, {
      data: { ids },
    });
  },
};
