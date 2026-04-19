import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/business/api/dashboard.api";

export const DASHBOARD_CYCLES_QUERY_KEY = ["dashboard", "cycles-summary"] as const;

export function useDashboardCycles() {
  return useQuery({
    queryKey: DASHBOARD_CYCLES_QUERY_KEY,
    queryFn: async () => {
      const response = await dashboardService.getCyclesSummary();

      if (!response.Success) {
        throw new Error(response.Message || "Không thể tải dữ liệu dashboard.");
      }

      return response.Data ?? [];
    },
  });
}
