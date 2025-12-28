import { Button } from "@/components/ui/Button";
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
import type { Menu } from "@/features/system/types/menu.types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMenuForm } from "@/features/system/hooks/useMenuForm";

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
  const {
    name,
    setName,
    controller,
    setController,
    sort,
    setSort,
    systemGroupId,
    setSystemGroupId,
    canView,
    setCanView,
    canAdd,
    setCanAdd,
    canUpdate,
    setCanUpdate,
    canDelete,
    setCanDelete,
    canApprove,
    setCanApprove,
    canAnalyze,
    setCanAnalyze,
    systemGroups,
    onSubmit,
    isActived,
    setIsActived,
    isShowMenu,
    setIsShowMenu,
  } = useMenuForm(data, saveChange);

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
                  setSystemGroupId(value === "no-parent" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn nhóm quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="no-parent">Chọn nhóm quyền</SelectItem>
                    {systemGroups.map((item) => (
                      <SelectItem key={item.Value} value={item.Value || ""}>
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
            <div className="grid gap-3">
              <Label>Trạng thái</Label>
              <Select
                value={isActived ? "true" : "false"}
                onValueChange={(value) =>
                  setIsActived(value === "true" ? true : false)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Không hoạt động</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Hiển thị Menu</Label>
              <Checkbox
                id="isShowMenu"
                checked={isShowMenu}
                onCheckedChange={(c) => setIsShowMenu(!!c)}
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
