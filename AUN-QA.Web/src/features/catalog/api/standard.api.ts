import api, { type ApiResponse } from "@/lib/api";
import type { Standard } from "@/features/catalog/types/standard.types";
import type { GetListPagingRequest, GetListPagingResponse, ModelCombobox } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";

export const standardService = {
    getList: async (request: GetListPagingRequest): Promise<ApiResponse<GetListPagingResponse<Standard>>> => {
        return api.post<GetListPagingResponse<Standard>>(API_ENDPOINTS.Catalog.Standard.GET_LIST, request);
    },

    getById: async (id: string): Promise<ApiResponse<Standard>> => {
        return api.get<Standard>(API_ENDPOINTS.Catalog.Standard.GET_BY_ID, { params: { id } });
    },

    insert: async (data: Standard): Promise<ApiResponse<Standard>> => {
        return api.post<Standard>(API_ENDPOINTS.Catalog.Standard.INSERT, data);
    },

    update: async (data: Standard): Promise<ApiResponse<Standard>> => {
        return api.put<Standard>(API_ENDPOINTS.Catalog.Standard.UPDATE, data);
    },

    deleteList: async (ids: string[]): Promise<ApiResponse<string>> => {
        return api.delete<string>(API_ENDPOINTS.Catalog.Standard.DELETE_LIST, { data: { ids } });
    },

    getAllCombobox: async (): Promise<ApiResponse<ModelCombobox[]>> => {
        return api.get<ModelCombobox[]>(API_ENDPOINTS.Catalog.Standard.GET_ALL_COMBOBOX);
    }
};
