import api, { type ApiResponse } from "@/lib/api";
import type { Criterion } from "@/features/catalog/types/criterion.types";
import type { GetListPagingRequest, GetListPagingResponse, ModelCombobox } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";

export const criterionService = {
    getList: async (request: GetListPagingRequest): Promise<ApiResponse<GetListPagingResponse<Criterion>>> => {
        return api.post<GetListPagingResponse<Criterion>>(API_ENDPOINTS.Catalog.Criterion.GET_LIST, request);
    },

    getById: async (id: string): Promise<ApiResponse<Criterion>> => {
        return api.get<Criterion>(API_ENDPOINTS.Catalog.Criterion.GET_BY_ID, { params: { id } });
    },

    insert: async (data: Criterion): Promise<ApiResponse<Criterion>> => {
        return api.post<Criterion>(API_ENDPOINTS.Catalog.Criterion.INSERT, data);
    },

    update: async (data: Criterion): Promise<ApiResponse<Criterion>> => {
        return api.put<Criterion>(API_ENDPOINTS.Catalog.Criterion.UPDATE, data);
    },

    deleteList: async (ids: string[]): Promise<ApiResponse<string>> => {
        return api.delete<string>(API_ENDPOINTS.Catalog.Criterion.DELETE_LIST, { data: { ids } });
    },

    getAllCombobox: async (): Promise<ApiResponse<ModelCombobox[]>> => {
        return api.get<ModelCombobox[]>(API_ENDPOINTS.Catalog.Criterion.GET_ALL_COMBOBOX);
    }
};
