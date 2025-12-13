import { useEffect, useMemo, useState } from "react";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { userService } from "@/services/system/user.service";
import type { User } from "@/types/system/user.types";
import { toast } from "sonner";
import type {
  GetListPagingRequest,
  GetListPagingResponse,
} from "@/types/base/base.types";
import PopupDetail from "./PopupDetail";
import type { ApiResponse } from "@/lib/api";
import type { RowSelectionState } from "@tanstack/react-table";
import { v4 as uuidv4 } from "uuid";

const UserPage = () => {
  const [data, setData] = useState<GetListPagingResponse<User>>({
    Data: [],
    TotalRow: 0,
    PageIndex: 1,
    PageSize: 10,
  });
  const [user, setUser] = useState<User | null>(null);
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
      const response = await userService.getById(id);
      if (response?.Success) {
        setUser({ ...response.Data, IsEdit: isEdit });
      } else {
        toast.error(response?.Message);
      }
    } else {
      setUser({ Id: id, Username: "", Fullname: "", IsEdit: isEdit });
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    setUser(null);
  };

  const saveChange = async (saveUser: User, isAddMore: boolean) => {
    if (saveUser) {
      let response: ApiResponse<User>;
      if (saveUser.IsEdit) {
        response = await userService.update(saveUser);
      } else {
        response = await userService.insert(saveUser);
      }

      if (response?.Success) {
        if (saveUser.IsEdit) {
          toast.success("Cập nhật thành công");
        } else {
          toast.success("Thêm mới thành công");
        }
        setIsOpen(isAddMore);
        setUser({
          Id: uuidv4(),
          Username: "",
          Fullname: "",
          Password: "",
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
    const response = await userService.deleteList(ids);
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
      const response = await userService.getList(request);
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
        user={user}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        saveChange={saveChange}
      />
    </div>
  );
};

export default UserPage;
