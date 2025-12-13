import api, { type ApiResponse } from "@/lib/api";
import type { Permission, PermissionRequest, Role } from "@/types/identity/role.types";
import type { GetListPagingRequest } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";
import type { GetListPagingResponse } from "@/types/base/base.types";

export const roleService = {
  getList: async (
    request: GetListPagingRequest
  ): Promise<ApiResponse<GetListPagingResponse<Role>>> => {
    return api.post<GetListPagingResponse<Role>>(
      API_ENDPOINTS.Identity.Role.GET_LIST,
      request
    );
  },

  getById: async (id: string): Promise<ApiResponse<Role>> => {
    return api.get<Role>(API_ENDPOINTS.Identity.Role.GET_BY_ID, {
      params: { id },
    });
  },

  insert: async (data: Role): Promise<ApiResponse<Role>> => {
    return api.post<Role>(API_ENDPOINTS.Identity.Role.INSERT, data);
  },

  update: async (data: Role): Promise<ApiResponse<Role>> => {
    return api.put<Role>(API_ENDPOINTS.Identity.Role.UPDATE, data);
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<Role[]>> => {
    return api.delete<Role[]>(API_ENDPOINTS.Identity.Role.DELETE_LIST, {
      data: { ids },
    });
  },

  getPermissionsByRole: async (id: string): Promise<ApiResponse<Permission[]>> => {
    return api.get<Permission[]>(API_ENDPOINTS.Identity.Role.GET_PERMISSIONS_BY_ROLE, {
      params: { id },
    });
  },
  
  updatePermission: async (data: PermissionRequest[]): Promise<ApiResponse<boolean>> => {
      return api.put<boolean>(API_ENDPOINTS.Identity.Role.UPDATE_PERMISSIONS, {
        permissions: data
      });
  }
};
