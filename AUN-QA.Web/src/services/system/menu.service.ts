import api, { type ApiResponse } from "@/lib/api";
import type { Menu } from "@/types/system/menu.types";
import type { GetListPagingRequest } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";
import type { GetListPagingResponse } from "@/types/base/base.types";

export const menuService = {
  getList: async (
    request: GetListPagingRequest
  ): Promise<ApiResponse<GetListPagingResponse<Menu>>> => {
    return api.post<GetListPagingResponse<Menu>>(
      API_ENDPOINTS.System.Menu.GET_LIST,
      request
    );
  },

  getById: async (id: string): Promise<ApiResponse<Menu>> => {
    return api.get<Menu>(API_ENDPOINTS.System.Menu.GET_BY_ID, {
      params: { id },
    });
  },

  insert: async (data: Menu): Promise<ApiResponse<Menu>> => {
    return api.post<Menu>(API_ENDPOINTS.System.Menu.INSERT, data);
  },

  update: async (data: Menu): Promise<ApiResponse<Menu>> => {
    return api.put<Menu>(API_ENDPOINTS.System.Menu.UPDATE, data);
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<Menu[]>> => {
    return api.delete<Menu[]>(API_ENDPOINTS.System.Menu.DELETE_LIST, {
      data: { ids },
    });
  },
};
