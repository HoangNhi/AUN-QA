import api, { type ApiResponse } from "@/lib/api";
import type { SystemGroup } from "@/types/identity/systemGroup.types";
import type { GetListPagingRequest } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";
import type { GetListPagingResponse } from "@/types/base/base.types";

export const systemGroupService = {
  getList: async (request: GetListPagingRequest): Promise<ApiResponse<GetListPagingResponse<SystemGroup>>> => {
    return api.post<GetListPagingResponse<SystemGroup>>(API_ENDPOINTS.Identity.SystemGroup.GET_LIST, request);
  },

  getById: async (id: string): Promise<ApiResponse<SystemGroup>> => {
    return api.get<SystemGroup>(API_ENDPOINTS.Identity.SystemGroup.GET_BY_ID, { params: { id } });
  },

  insert: async (data: SystemGroup): Promise<ApiResponse<SystemGroup>> => {
    return api.post<SystemGroup>(API_ENDPOINTS.Identity.SystemGroup.INSERT, data);
  },

  update: async (data: SystemGroup): Promise<ApiResponse<SystemGroup>> => {
    return api.put<SystemGroup>(API_ENDPOINTS.Identity.SystemGroup.UPDATE, data);
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<SystemGroup[]>> => {
    return api.delete<SystemGroup[]>(API_ENDPOINTS.Identity.SystemGroup.DELETE_LIST, { data: { ids } });
  },
};
