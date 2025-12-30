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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadFile, { type UploadFileRef } from "@/components/ui/upload-file";
import type { Evidence } from "@/features/business/types/evidence.types";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import React, { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupEvidence = ({
  evidence,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  evidence: Evidence | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (evidence: Evidence, isAddMore: boolean) => void;
}) => {
  const [id] = useState<string | null>(evidence?.Id || uuidv4());
  const [name, setName] = useState(evidence?.Name || "");
  const [isActived, setIsActived] = useState<boolean>(
    evidence?.IsActived ?? true
  );
  const uploadRef = useRef<UploadFileRef>(null);
  const [folderUpload, setFolderUpload] = useState<string>(
    evidence?.FolderUpload || uuidv4()
  );
  const [listAttachment, setListAttachment] = useState<Attachment[]>(
    evidence?.ListAttachment || []
  );

  const onSubmit = async (isAddMore: boolean) => {
    await uploadRef.current?.upload();
    saveChange(
      {
        Id: id || uuidv4(),
        Name: name,
        IsEdit: evidence?.IsEdit || false,
        IsActived: isActived,
        FolderUpload: folderUpload,
        AttachmentIds: listAttachment.map((a) => a.Id),
      },
      isAddMore
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl"
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
              {evidence?.IsEdit ? "Cập nhật Minh chứng" : "Thêm mới Minh chứng"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden grid grid-cols-12">
            <div className="col-span-5">
              <div className="grid gap-3">
                <div className="grid gap-3">
                  <Label>Tên minh chứng</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  <Label>Tệp đính kèm</Label>
                  <UploadFile
                    ref={uploadRef}
                    listAttachment={listAttachment}
                    folderUpload={folderUpload}
                    setListAttachment={setListAttachment}
                  />
                </div>
              </div>
            </div>
            <div className="col-span-7">Test</div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
            {!evidence?.IsEdit && (
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

export default PopupEvidence;
