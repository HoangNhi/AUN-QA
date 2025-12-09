import { useEffect, useMemo, useState } from "react";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { systemGroupService } from "@/services/identity/systemGroup.service";
import type { SystemGroup } from "@/types/identity/systemGroup.types";
import { toast } from "sonner";
import type {
  GetListPagingRequest,
  GetListPagingResponse,
} from "@/types/base/base.types";
import PopupDetail from "./PopupDetail";
import type { ApiResponse } from "@/lib/api";
import type { RowSelectionState } from "@tanstack/react-table";
import { v4 as uuidv4 } from "uuid";

const SystemGroupPage = () => {
  const [data, setData] = useState<GetListPagingResponse<SystemGroup>>({
    Data: [],
    TotalRow: 0,
    PageIndex: 1,
    PageSize: 10,
  });
  const [selectedItem, setSelectedItem] = useState<SystemGroup | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pageRequest, setPageRequest] = useState<GetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const showPopupDetail = async (id: string, isEdit: boolean) => {
    setIsOpen(true);
    if (isEdit) {
      const response = await systemGroupService.getById(id);
      if (response?.Success) {
        setSelectedItem({ ...response.Data, IsEdit: isEdit });
      } else {
        toast.error(response?.Message);
      }
    } else {
      setSelectedItem({ Id: id, Name: "", Sort: 0, IsEdit: isEdit });
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    setSelectedItem(null);
  };

  const saveChange = async (item: SystemGroup, isAddMore: boolean) => {
    if (item) {
      let response: ApiResponse<SystemGroup>;
      if (item.IsEdit) {
        response = await systemGroupService.update(item);
      } else {
        response = await systemGroupService.insert(item);
      }

      if (response?.Success) {
        if (item.IsEdit) {
          toast.success("Cập nhật thành công");
        } else {
          toast.success("Thêm mới thành công");
        }
        setIsOpen(isAddMore);
        setSelectedItem({
          Id: uuidv4(),
          Name: "",
          Sort: 0,
          IsEdit: false,
        });
        getList({
          PageIndex: pageRequest.PageIndex,
          PageSize: pageRequest.PageSize,
          TextSearch: pageRequest.TextSearch,
        });
      } else {
        toast.error(response?.Message);
      }
    }
  };

  const deleteList = async (ids: string[]) => {
    const response = await systemGroupService.deleteList(ids);
    if (response?.Success) {
      toast.success("Xóa dữ liệu thành công");
      getList({
        PageIndex: pageRequest.PageIndex,
        PageSize: pageRequest.PageSize,
        TextSearch: pageRequest.TextSearch,
      });
    } else {
      toast.error(response?.Message);
    }
  };

  const getList = async (request: GetListPagingRequest) => {
    try {
      const response = await systemGroupService.getList(request);
      setData(
        response?.Data || {
          Data: [],
          TotalRow: 0,
          PageIndex: 1,
          PageSize: 10,
        }
      );
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setRowSelection({});
    }
  };

  useEffect(() => {
    getList(pageRequest);
  }, [pageRequest]);

  const columns = useMemo(() => getColumns(showPopupDetail, deleteList), []);

  return (
    <div className="container mx-auto ">
      <DataTable
        columns={columns}
        data={data.Data}
        totalRow={data.TotalRow}
        showPopupDetail={showPopupDetail}
        deleteList={deleteList}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pageRequest={pageRequest}
        setPageRequest={setPageRequest}
        getList={getList}
      />
      <PopupDetail
        data={selectedItem}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        saveChange={saveChange}
      />
    </div>
  );
};

export default SystemGroupPage;
