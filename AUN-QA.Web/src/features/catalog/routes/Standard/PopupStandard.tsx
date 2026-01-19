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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Standard } from "@/features/catalog/types/standard.types";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupStandard = ({
    standard,
    isOpen,
    onOpenChange,
    saveChange,
}: {
    standard: Standard | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    saveChange: (standard: Standard, isAddMore: boolean) => void;
}) => {
    const [id] = useState<string | null>(standard?.Id || uuidv4());
    const [code, setCode] = useState(standard?.Code || "");
    const [name, setName] = useState(standard?.Name || "");
    const [description, setDescription] = useState(standard?.Description || "");
    const [aunVersion, setAunVersion] = useState(standard?.AunVersion || "");
    const [isActived, setIsActived] = useState<boolean>(
        standard?.IsActived ?? true
    );

    const onSubmit = (isAddMore: boolean) => {
        saveChange(
            {
                Id: id || uuidv4(),
                Code: code,
                Name: name,
                Description: description,
                AunVersion: aunVersion,
                IsEdit: standard?.IsEdit || false,
                IsActived: isActived,
            },
            isAddMore
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[600px]"
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
                            {standard?.IsEdit ? "Cập nhật Tiêu chuẩn" : "Thêm mới Tiêu chuẩn"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="grid gap-3">
                            <Label>Mã tiêu chuẩn</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: AUN-QA-01" />
                        </div>
                        <div className="grid gap-3">
                            <Label>Tên tiêu chuẩn</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Mục tiêu dự kiến của chương trình đào tạo" />
                        </div>
                        <div className="grid gap-3">
                            <Label>Mô tả</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Nhập mô tả chi tiết về tiêu chuẩn..."
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Phiên bản AUN-QA</Label>
                            <Input
                                value={aunVersion}
                                onChange={(e) => setAunVersion(e.target.value)}
                                placeholder="VD: 4.0"
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
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Hủy</Button>
                        </DialogClose>
                        <Button type="submit">Lưu</Button>
                        {!standard?.IsEdit && (
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

export default PopupStandard;
