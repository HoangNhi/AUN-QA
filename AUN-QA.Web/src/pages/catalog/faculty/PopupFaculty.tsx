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
import type { Faculty } from "@/types/catalog/faculty.types";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupFaculty = ({
  faculty,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  faculty: Faculty | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (faculty: Faculty, isAddMore: boolean) => void;
}) => {
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const onSubmit = (isAddMore: boolean) => {
    saveChange(
      {
        Id: id || uuidv4(),
        Name: name,
        IsEdit: faculty?.IsEdit || false,
      },
      isAddMore
    );
  };

  useEffect(() => {
    if (faculty?.Id) {
      setId(faculty.Id);
      setName(faculty.Name);
    } else {
      setId(uuidv4());
      setName("");
    }
  }, [faculty]);

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
              {faculty?.IsEdit ? "Cập nhật Khoa" : "Thêm mới Khoa"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label>Tên khoa</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
            {!faculty?.IsEdit && (
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

export default PopupFaculty;
