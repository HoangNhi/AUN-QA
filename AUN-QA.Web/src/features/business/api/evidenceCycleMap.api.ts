import api, { type ApiResponse } from "@/lib/api";
import type {
  GetListPagingResponse,
  ModelCombobox,
} from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config/constants";
import type {
  ApproveRequest,
  EvidenceCycleMap,
  EvidenceCycleMapGetListPaging,
  EvidenceCycleMapGetListPagingRequest,
  SubmitToApproveRequest,
} from "../types/evidence-cycle-map.types";

// Backend response type (with underscore naming)
interface BackendEvidenceCycleMapGetListPaging {
  Id: string;
  EvidenceId: string;
  CycleId: string;
  ReviewStatus: number;
  FinalDecisionBy?: string;
  FinalDecisionAt?: string;
  Evidence_Name?: string;
  Evidence_Code?: string;
  Evidence_Status?: number;
  CycleName?: string;
  CreatedAt?: string;
  CreatedBy?: string;
  UpdatedAt?: string;
  UpdatedBy?: string;
  IsActived?: boolean;
  IsDeleted?: boolean;
}

// Transform backend response to frontend naming convention
const transformEvidenceCycleMapResponse = (
  backendData: BackendEvidenceCycleMapGetListPaging,
): EvidenceCycleMapGetListPaging => ({
  Id: backendData.Id,
  EvidenceId: backendData.EvidenceId,
  CycleId: backendData.CycleId,
  ReviewStatus: backendData.ReviewStatus,
  FinalDecisionBy: backendData.FinalDecisionBy,
  FinalDecisionAt: backendData.FinalDecisionAt,
  evidenceName: backendData.Evidence_Name,
  evidenceCode: backendData.Evidence_Code,
  evidenceStatus: backendData.Evidence_Status,
  cycleName: backendData.CycleName,
  CreatedAt: backendData.CreatedAt ?? "",
  CreatedBy: backendData.CreatedBy ?? "",
  UpdatedAt: backendData.UpdatedAt,
  UpdatedBy: backendData.UpdatedBy,
  IsActived: backendData.IsActived ?? false,
  IsDeleted: backendData.IsDeleted ?? false,
  IsEdit: false,
  FolderUpload: "",
});

export const evidenceCycleMapService = {
  getList: async (
    request: EvidenceCycleMapGetListPagingRequest,
  ): Promise<
    ApiResponse<GetListPagingResponse<EvidenceCycleMapGetListPaging>>
  > => {
    const response = await api.post<
      GetListPagingResponse<BackendEvidenceCycleMapGetListPaging>
    >(API_ENDPOINTS.Business.EvidenceCycleMap.GET_LIST, request);

    // Transform backend response to frontend naming convention
    if (response.Success && response.Data) {
      return {
        ...response,
        Data: {
          ...response.Data,
          Data: response.Data.Data.map(transformEvidenceCycleMapResponse),
        },
      };
    }

    return response as ApiResponse<
      GetListPagingResponse<EvidenceCycleMapGetListPaging>
    >;
  },

  getById: async (id: string): Promise<ApiResponse<EvidenceCycleMap>> => {
    return api.get<EvidenceCycleMap>(
      API_ENDPOINTS.Business.EvidenceCycleMap.GET_BY_ID,
      { params: { id } },
    );
  },

  insertWithEvidence: async (
    data: EvidenceCycleMap,
  ): Promise<ApiResponse<EvidenceCycleMap>> => {
    return api.post<EvidenceCycleMap>(
      API_ENDPOINTS.Business.EvidenceCycleMap.INSERT_WITH_EVIDENCE,
      data,
    );
  },

  update: async (
    data: EvidenceCycleMap,
  ): Promise<ApiResponse<EvidenceCycleMap>> => {
    return api.put<EvidenceCycleMap>(
      API_ENDPOINTS.Business.EvidenceCycleMap.UPDATE,
      data,
    );
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<string>> => {
    return api.delete<string>(
      API_ENDPOINTS.Business.EvidenceCycleMap.DELETE_LIST,
      { data: { ids } },
    );
  },

  getAllCombobox: async (): Promise<ApiResponse<ModelCombobox[]>> => {
    return api.get<ModelCombobox[]>(
      API_ENDPOINTS.Business.EvidenceCycleMap.GET_ALL_COMBOBOX,
    );
  },

  submitToApprove: async (
    request: SubmitToApproveRequest,
  ): Promise<ApiResponse<string>> => {
    return api.post<string>(
      API_ENDPOINTS.Business.EvidenceCycleMap.SUBMIT_TO_APPROVE,
      request,
    );
  },

  approve: async (request: ApproveRequest): Promise<ApiResponse<string>> => {
    return api.post<string>(
      API_ENDPOINTS.Business.EvidenceCycleMap.APPROVE,
      request,
    );
  },
};
