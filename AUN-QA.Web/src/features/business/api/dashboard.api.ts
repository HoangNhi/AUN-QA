import api, { type ApiResponse } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/constants";
import type { CycleSummary } from "@/features/business/types/dashboard.types";

export const dashboardService = {
  getCyclesSummary: async (): Promise<ApiResponse<CycleSummary[]>> => {
    return api.get<CycleSummary[]>(API_ENDPOINTS.Business.Dashboard.GET_CYCLES_SUMMARY);
  },
};
