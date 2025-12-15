import api, { type ApiResponse } from "@/lib/api";
import type { User } from "@/types/system/user.types";
import type { GetListPagingRequest } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";
import type { GetListPagingResponse } from "@/types/base/base.types";

export const userService = {
  getList: async (request: GetListPagingRequest): Promise<ApiResponse<GetListPagingResponse<User>>> => {
    return api.post<GetListPagingResponse<User>>(API_ENDPOINTS.System.User.GET_LIST, request);
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    return api.get<User>(API_ENDPOINTS.System.User.GET_BY_ID, { params: { id } });
  },

  insert: async (user: User): Promise<ApiResponse<User>> => {
    return api.post<User>(API_ENDPOINTS.System.User.INSERT, user);
  },

  update: async (user: User): Promise<ApiResponse<User>> => {
    return api.put<User>(API_ENDPOINTS.System.User.UPDATE, user);
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<User[]>> => {
    return api.delete<User[]>(API_ENDPOINTS.System.User.DELETE_LIST, { data: { ids } });
  },
};
