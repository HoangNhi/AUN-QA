import api, { type ApiResponse } from "@/lib/api";
import type {
  GetStakeholderNotInCampaignRequest,
  SurveyCampaign,
  SurveyCampaignGetListPaging,
  SurveyCampaignGetListPagingRequest,
} from "../types/survey-campaign.types";
import type { GetListPagingResponse } from "@/types/base/base.types";
import { API_ENDPOINTS } from "@/config";
import type { Stakeholder } from "@/features/catalog/types/stakeholder.types";

export const surveyCampaignService = {
  getList: async (
    request: SurveyCampaignGetListPagingRequest,
  ): Promise<
    ApiResponse<GetListPagingResponse<SurveyCampaignGetListPaging>>
  > => {
    // Clean request: convert empty string CycleId to undefined for backend Nullable<Guid>
    const cleanedRequest = {
      ...request,
      CycleId: request.CycleId || undefined,
    };
    return api.post<GetListPagingResponse<SurveyCampaignGetListPaging>>(
      API_ENDPOINTS.Business.SurveyCampaign.GET_LIST,
      cleanedRequest,
    );
  },

  getById: async (id: string): Promise<ApiResponse<SurveyCampaign>> => {
    return api.get<SurveyCampaign>(
      API_ENDPOINTS.Business.SurveyCampaign.GET_BY_ID,
      {
        params: { id },
      },
    );
  },

  insert: async (
    request: SurveyCampaign,
  ): Promise<ApiResponse<SurveyCampaign>> => {
    return api.post<SurveyCampaign>(
      API_ENDPOINTS.Business.SurveyCampaign.INSERT,
      request,
    );
  },

  update: async (
    request: SurveyCampaign,
  ): Promise<ApiResponse<SurveyCampaign>> => {
    return api.put<SurveyCampaign>(
      API_ENDPOINTS.Business.SurveyCampaign.UPDATE,
      request,
    );
  },

  deleteList: async (ids: string[]): Promise<ApiResponse<string>> => {
    return api.delete<string>(
      API_ENDPOINTS.Business.SurveyCampaign.DELETE_LIST,
      {
        data: { Ids: ids },
      },
    );
  },

  getStakeholderNotInCampaign: async (
    request: GetStakeholderNotInCampaignRequest,
  ): Promise<ApiResponse<GetListPagingResponse<Stakeholder>>> => {
    return api.post<GetListPagingResponse<Stakeholder>>(
      API_ENDPOINTS.Business.SurveyCampaign.GET_STAKEHOLDER_NOT_IN_CAMPAIGN,
      request,
    );
  },
};
