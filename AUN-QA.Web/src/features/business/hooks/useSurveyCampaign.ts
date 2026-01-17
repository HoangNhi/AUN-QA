import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  SurveyCampaign,
  SurveyCampaignGetListPagingRequest,
} from "../types/survey-campaign.types";
import { surveyCampaignService } from "../api/survey-campaign.api";

export const useSurveyCampaign = () => {
  const [data, setData] = useState<{
    Data: SurveyCampaign[];
    TotalRow: number;
  }>({
    Data: [],
    TotalRow: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [surveyCampaign, setSurveyCampaign] = useState<SurveyCampaign | null>(
    null,
  );

  const [pageRequest, setPageRequest] =
    useState<SurveyCampaignGetListPagingRequest>({
      PageIndex: 1,
      PageSize: 10,
      TextSearch: "",
    });

  const [rowSelection, setRowSelection] = useState({});

  const getList = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await surveyCampaignService.getList(pageRequest);
      if (res.Success && res.Data) {
        setData(res.Data);
      } else {
        toast(res.Message || "Không thể tải danh sách");
      }
    } catch (error) {
      console.error(error);
      toast("Không thể tải danh sách chiến dịch khảo sát");
    } finally {
      setIsFetching(false);
    }
  }, [pageRequest]);

  useEffect(() => {
    getList();
  }, [getList]);

  const showPopupDetail = (id?: string) => {
    if (id) {
      setIsLoading(true);
      surveyCampaignService
        .getById(id)
        .then((res) => {
          if (res.Success && res.Data) {
            setSurveyCampaign({ ...res.Data, IsEdit: true } as any);
            setIsOpen(true);
          } else {
            toast(res.Message || "Không thể lấy thông tin chi tiết");
          }
        })
        .catch((err) => {
          console.error(err);
          toast("Không thể lấy thông tin chi tiết");
        })
        .finally(() => setIsLoading(false));
    } else {
      setSurveyCampaign(null);
      setIsOpen(true);
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSurveyCampaign(null);
    }
  };

  const saveChange = async (
    data: SurveyCampaign & { IsEdit: boolean },
    isAddMore: boolean,
  ) => {
    setIsLoading(true);
    try {
      const { IsEdit, ...payload } = data;
      let res;
      if (IsEdit) {
        res = await surveyCampaignService.update(payload);
      } else {
        res = await surveyCampaignService.insert(payload);
      }

      if (res.Success) {
        toast(IsEdit ? "Cập nhật thành công" : "Thêm mới thành công");
        if (isAddMore) {
          setSurveyCampaign(null);
          // Reset for new entry, keeping popup open
        } else {
          setIsOpen(false);
        }
        getList();
      } else {
        toast(res.Message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error(error);
      const description =
        error.response?.data?.Message ||
        (data.IsEdit ? "Không thể cập nhật" : "Không thể thêm mới");

      toast(description);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteList = async (ids: string[]) => {
    if (ids.length === 0) return;
    setIsLoading(true);
    try {
      const res = await surveyCampaignService.deleteList(ids);
      if (res.Success) {
        toast("Xóa chiến dịch thành công");
        setRowSelection({});
        getList();
      } else {
        toast(res.Message || "Không thể xóa chiến dịch");
      }
    } catch (error) {
      console.error(error);
      toast("Không thể xóa chiến dịch");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    surveyCampaign,
    isOpen,
    pageRequest,
    rowSelection,
    setPageRequest,
    setRowSelection,
    getList,
    showPopupDetail,
    onOpenChange,
    saveChange,
    deleteList,
    isLoading,
    isFetching,
  };
};
