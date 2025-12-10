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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { systemGroupService } from "@/services/identity/systemGroup.service";
import type { ModelCombobox } from "@/types/base/base.types";
import type { SystemGroup } from "@/types/identity/systemGroup.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const PopupDetail = ({
  data,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  data: SystemGroup | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (data: SystemGroup, isAddMore: boolean) => void;
}) => {
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sort, setSort] = useState(0);
  const [parentId, setParentId] = useState<string | null>(null);
  const [comboboxSystemGroup, setComboboxSystemGroup] = useState<
    ModelCombobox[]
  >([]);

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id || uuidv4(),
        Name: name,
        Sort: sort,
        IsEdit: data?.IsEdit || false,
      },
      isAddMore
    );
  };

  useEffect(() => {
    if (data?.Id && data.IsEdit) {
      setId(data.Id);
      setName(data.Name);
      setSort(data.Sort);
      setParentId(data.ParentId);
    } else {
      setId(uuidv4());
      setName("");
      setSort(0);
      setParentId(null);
    }
  }, [data]);

  useEffect(() => {
    const fetchComboboxSystemGroup = async () => {
      const response = await systemGroupService.getAllCombobox();
      if (response.Success) {
        setComboboxSystemGroup(response.Data);
      } else {
        toast.error(response.Message);
      }
    };

    fetchComboboxSystemGroup();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
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
              {data?.IsEdit ? "Cập nhật Nhóm quyền" : "Thêm mới Nhóm quyền"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label>Tên gọi</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-3">
              <Label>Nhóm quyền</Label>
              <Select
                value={parentId || "no-parent"}
                onValueChange={(value) =>
                  setParentId(value === "no-parent" ? null : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn nhóm quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="no-parent">Chọn nhóm quyền</SelectItem>
                    {comboboxSystemGroup.map((item) => (
                      <SelectItem key={item.Value} value={item.Value}>
                        {item.Text}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Sắp xếp</Label>
              <Input
                type="number"
                value={sort}
                onChange={(e) => setSort(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
            <Button type="button" onClick={() => onSubmit(true)}>
              Lưu và thêm tiếp
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupDetail;
