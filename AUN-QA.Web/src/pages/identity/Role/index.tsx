import { useCallback, useEffect, useMemo, useState } from "react";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { roleService } from "@/services/identity/role.service";
import type { Role } from "@/types/identity/role.types";
import { toast } from "sonner";
import type {
  GetListPagingRequest,
  GetListPagingResponse,
} from "@/types/base/base.types";
import PopupDetail from "./PopupDetail";
import type { ApiResponse } from "@/lib/api";
import type { RowSelectionState } from "@tanstack/react-table";
import { v4 as uuidv4 } from "uuid";

const RolePage = () => {
  const [data, setData] = useState<GetListPagingResponse<Role>>({
    Data: [],
    TotalRow: 0,
    PageIndex: 1,
    PageSize: 10,
  });
  const [selectedItem, setSelectedItem] = useState<Role | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pageRequest, setPageRequest] = useState<GetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const showPopupDetail = useCallback(async (id: string, isEdit: boolean) => {
    if (isEdit) {
      const response = await roleService.getById(id);
      if (response?.Success && response.Data) {
        setSelectedItem({ ...response.Data, IsEdit: isEdit });
        setIsOpen(true);
      } else {
        toast.error(response?.Message);
      }
    } else {
      setSelectedItem({
        Id: id,
        Name: "",
        IsEdit: isEdit,
      });
      setIsOpen(true);
    }
  }, []);

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    setSelectedItem(null);
  };

  const getList = useCallback(async (request: GetListPagingRequest) => {
    try {
      const response = await roleService.getList(request);
      setData(
        response?.Data || {
          Data: [],
          TotalRow: 0,
          PageIndex: 1,
          PageSize: 10,
        }
      );
    } catch {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setRowSelection({});
    }
  }, []);

  const saveChange = async (item: Role, isAddMore: boolean) => {
    if (item) {
      let response: ApiResponse<Role>;
      if (item.IsEdit) {
        response = await roleService.update(item);
      } else {
        response = await roleService.insert(item);
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

  const deleteList = useCallback(
    async (ids: string[]) => {
      const response = await roleService.deleteList(ids);
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
    },
    [pageRequest, getList]
  );

  useEffect(() => {
    getList(pageRequest);
  }, [pageRequest, getList]);

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList),
    [showPopupDetail, deleteList]
  );

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
      {isOpen && (
        <PopupDetail
          key={selectedItem?.Id || "new"}
          data={selectedItem}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
        />
      )}
    </div>
  );
};

export default RolePage;
