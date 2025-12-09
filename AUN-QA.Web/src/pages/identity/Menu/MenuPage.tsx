import { useEffect, useMemo, useState } from "react";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { menuService } from "@/services/identity/menu.service";
import type { Menu } from "@/types/identity/menu.types";
import { toast } from "sonner";
import type {
  GetListPagingRequest,
  GetListPagingResponse,
} from "@/types/base/base.types";
import PopupDetail from "./PopupDetail";
import type { ApiResponse } from "@/lib/api";
import type { RowSelectionState } from "@tanstack/react-table";
import { v4 as uuidv4 } from "uuid";

const MenuPage = () => {
  const [data, setData] = useState<GetListPagingResponse<Menu>>({
    Data: [],
    TotalRow: 0,
    PageIndex: 1,
    PageSize: 10,
  });
  const [selectedItem, setSelectedItem] = useState<Menu | null>(null);
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
      const response = await menuService.getById(id);
      if (response?.Success) {
        setSelectedItem({ ...response.Data, IsEdit: isEdit });
      } else {
        toast.error(response?.Message);
      }
    } else {
      setSelectedItem({
        Id: id,
        Name: "",
        Controller: "",
        Sort: 0,
        SystemGroupId: "",
        CanView: false,
        CanAdd: false,
        CanUpdate: false,
        CanDelete: false,
        CanApprove: false,
        CanAnalyze: false,
        IsEdit: isEdit,
      });
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    setSelectedItem(null);
  };

  const saveChange = async (item: Menu, isAddMore: boolean) => {
    if (item) {
      let response: ApiResponse<Menu>;
      if (item.IsEdit) {
        response = await menuService.update(item);
      } else {
        response = await menuService.insert(item);
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
          Controller: "",
          Sort: 0,
          SystemGroupId: "",
          CanView: false,
          CanAdd: false,
          CanUpdate: false,
          CanDelete: false,
          CanApprove: false,
          CanAnalyze: false,
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
    const response = await menuService.deleteList(ids);
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
      const response = await menuService.getList(request);
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

export default MenuPage;
