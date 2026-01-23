import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GetListSessionRequest } from "../types/survey-campaign.types";
import { surveyCampaignService } from "../api/survey-campaign.api";

export const useSurveySession = (
  request: GetListSessionRequest,
  enabled: boolean = true,
) => {
  const {
    data: listResponse,
    refetch,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["survey-sessions", request],
    queryFn: async () => {
      const response = await surveyCampaignService.getListSession(request);
      if (!response.Success) {
        toast.error(
          response.Message || "Không thể lấy danh sách người tham gia",
        );
        throw new Error(response.Message);
      }
      return response;
    },
    placeholderData: keepPreviousData,
    enabled: enabled && !!request.CampaignId,
  });

  const data = listResponse?.Data || {
    Data: [],
    TotalRow: 0,
    PageIndex: 1,
    PageSize: 10,
  };

  return {
    data: data.Data,
    totalRow: data.TotalRow,
    isFetching,
    isError,
    refetch,
  };
};
