import api, { type ApiResponse } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/constants";
import type { GetListPagingResponse } from "@/types/base/base.types";
import type {
  ActionPlanApproveRequest,
  ActionPlanAssignRequest,
  ActionPlanDeleteListRequest,
  ActionPlanDetail,
  ActionPlanExternalFindingRequest,
  ActionPlanGetListRequest,
  ActionPlanListItem,
  ActionPlanRequestRevisionRequest,
  ActionPlanSubmitRequest,
  ActionPlanUpsertRequest,
  ExternalFindingOption,
} from "../types/actionPlan.types";

export const actionPlanService = {
  getList: (request: ActionPlanGetListRequest): Promise<ApiResponse<GetListPagingResponse<ActionPlanListItem>>> =>
    api.post<GetListPagingResponse<ActionPlanListItem>>(API_ENDPOINTS.Business.ActionPlan.GET_LIST, request),

  getById: (id: string): Promise<ApiResponse<ActionPlanDetail>> =>
    api.get<ActionPlanDetail>(API_ENDPOINTS.Business.ActionPlan.GET_BY_ID, { params: { id } }),

  insert: (request: ActionPlanUpsertRequest): Promise<ApiResponse<ActionPlanDetail>> =>
    api.post<ActionPlanDetail>(API_ENDPOINTS.Business.ActionPlan.INSERT, request),

  update: (request: ActionPlanUpsertRequest): Promise<ApiResponse<ActionPlanDetail>> =>
    api.put<ActionPlanDetail>(API_ENDPOINTS.Business.ActionPlan.UPDATE, request),

  deleteList: (request: ActionPlanDeleteListRequest): Promise<ApiResponse<null>> =>
    api.delete<null>(API_ENDPOINTS.Business.ActionPlan.DELETE_LIST, { data: request }),

  submit: (request: ActionPlanSubmitRequest): Promise<ApiResponse<null>> =>
    api.post<null>(API_ENDPOINTS.Business.ActionPlan.SUBMIT, request),

  approve: (request: ActionPlanApproveRequest): Promise<ApiResponse<null>> =>
    api.post<null>(API_ENDPOINTS.Business.ActionPlan.APPROVE, request),

  requestRevision: (request: ActionPlanRequestRevisionRequest): Promise<ApiResponse<null>> =>
    api.post<null>(API_ENDPOINTS.Business.ActionPlan.REQUEST_REVISION, request),

  assign: (request: ActionPlanAssignRequest): Promise<ApiResponse<null>> =>
    api.post<null>(API_ENDPOINTS.Business.ActionPlan.ASSIGN, request),

  getExternalReviewFindings: (
    request: ActionPlanExternalFindingRequest,
  ): Promise<ApiResponse<ExternalFindingOption[]>> =>
    api.post<ExternalFindingOption[]>(
      API_ENDPOINTS.Business.ActionPlan.GET_EXTERNAL_REVIEW_FINDINGS,
      request,
    ),
};
