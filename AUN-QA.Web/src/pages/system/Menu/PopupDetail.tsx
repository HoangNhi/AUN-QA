import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Menu } from "@/types/system/menu.types";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { systemGroupService } from "@/services/system/systemGroup.service";
import type { ModelCombobox } from "@/types/base/base.types";

const PopupDetail = ({
  data,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  data: Menu | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (data: Menu, isAddMore: boolean) => void;
}) => {
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [controller, setController] = useState("");
  const [sort, setSort] = useState(0);
  const [systemGroupId, setSystemGroupId] = useState("");

  // Permissions
  const [canView, setCanView] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [canAnalyze, setCanAnalyze] = useState(false);

  // System Groups for dropdown
  const [systemGroups, setSystemGroups] = useState<ModelCombobox[]>([]);

  useEffect(() => {
    const fetchSystemGroups = async () => {
      // Fetch all system groups for dropdown (page index 1, large page size)
      const res = await systemGroupService.getAllCombobox();
      if (res?.Success && res.Data) {
        setSystemGroups(res.Data);
      }
    };
    if (isOpen) {
      fetchSystemGroups();
    }
  }, [isOpen]);

  const onSubmit = (isAddMore: boolean) => {
    if (!systemGroupId) {
      // Simple validation visualization could be added here
      return;
    }
    saveChange(
      {
        Id: id || uuidv4(),
        Name: name,
        Controller: controller,
        Sort: sort,
        SystemGroupId: systemGroupId,
        CanView: canView,
        CanAdd: canAdd,
        CanUpdate: canUpdate,
        CanDelete: canDelete,
        CanApprove: canApprove,
        CanAnalyze: canAnalyze,
        IsEdit: data?.IsEdit || false,
      },
      isAddMore
    );
  };

  useEffect(() => {
    if (data?.Id && data.IsEdit) {
      setId(data.Id);
      setName(data.Name);
      setController(data.Controller);
      setSort(data.Sort);
      setSystemGroupId(data.SystemGroupId);
      setCanView(data.CanView);
      setCanAdd(data.CanAdd);
      setCanUpdate(data.CanUpdate);
      setCanDelete(data.CanDelete);
      setCanApprove(data.CanApprove);
      setCanAnalyze(data.CanAnalyze);
    } else {
      setId(uuidv4());
      setName("");
      setController("");
      setSort(0);
      setSystemGroupId("");
      setCanView(false);
      setCanAdd(false);
      setCanUpdate(false);
      setCanDelete(false);
      setCanApprove(false);
      setCanAnalyze(false);
    }
  }, [data]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[700px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {data?.IsEdit ? "Cập nhật Menu" : "Thêm mới Menu"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label>Tên Menu</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-3">
              <Label>Controller</Label>
              <Input
                value={controller}
                onChange={(e) => setController(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label>Nhóm quyền</Label>
              <Select
                value={systemGroupId || "no-parent"}
                onValueChange={(value) =>
                  setSystemGroupId(value === "no-parent" ? null : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn nhóm quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="no-parent">Chọn nhóm quyền</SelectItem>
                    {systemGroups.map((item) => (
                      <SelectItem key={item.Value} value={item.Value}>
                        {item.Text}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Thứ tự</Label>
              <Input
                type="number"
                value={sort}
                onChange={(e) => setSort(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phân quyền</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canView"
                  checked={canView}
                  onCheckedChange={(c) => setCanView(!!c)}
                />
                <Label htmlFor="canView">Xem</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canAdd"
                  checked={canAdd}
                  onCheckedChange={(c) => setCanAdd(!!c)}
                />
                <Label htmlFor="canAdd">Thêm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canUpdate"
                  checked={canUpdate}
                  onCheckedChange={(c) => setCanUpdate(!!c)}
                />
                <Label htmlFor="canUpdate">Sửa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDelete"
                  checked={canDelete}
                  onCheckedChange={(c) => setCanDelete(!!c)}
                />
                <Label htmlFor="canDelete">Xóa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canApprove"
                  checked={canApprove}
                  onCheckedChange={(c) => setCanApprove(!!c)}
                />
                <Label htmlFor="canApprove">Duyệt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canAnalyze"
                  checked={canAnalyze}
                  onCheckedChange={(c) => setCanAnalyze(!!c)}
                />
                <Label htmlFor="canAnalyze">Thống kê</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
            {!data?.IsEdit && (
              <Button type="button" onClick={() => onSubmit(true)}>
                Lưu và thêm tiếp
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupDetail;
