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
import { Combobox } from "@/components/ui/combobox";
import type { Criterion } from "@/features/catalog/types/criterion.types";
import { standardService } from "@/features/catalog/api/standard.api";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const PopupCriterion = ({
    criterion,
    isOpen,
    onOpenChange,
    saveChange,
}: {
    criterion: Criterion | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    saveChange: (criterion: Criterion, isAddMore: boolean) => void;
}) => {
    const [id] = useState<string | null>(criterion?.Id || uuidv4());
    const [standardId, setStandardId] = useState(criterion?.StandardId || "");
    const [code, setCode] = useState(criterion?.Code || "");
    const [name, setName] = useState(criterion?.Name || "");
    const [description, setDescription] = useState(criterion?.Description || "");
    const [guidance, setGuidance] = useState(criterion?.Guidance || "");
    const [isActived, setIsActived] = useState<boolean>(
        criterion?.IsActived ?? true
    );

    const onSubmit = (isAddMore: boolean) => {
        if (!standardId) {
            alert("Vui lòng chọn tiêu chuẩn");
            return;
        }

        saveChange(
            {
                Id: id || uuidv4(),
                StandardId: standardId,
                StandardName: "", // Will be filled by backend
                Code: code,
                Name: name,
                Description: description,
                Guidance: guidance,
                IsEdit: criterion?.IsEdit || false,
                IsActived: isActived,
            },
            isAddMore
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
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
                            {criterion?.IsEdit ? "Cập nhật Tiêu chí" : "Thêm mới Tiêu chí"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="grid gap-3">
                            <Label>Tiêu chuẩn <span className="text-red-500">*</span></Label>
                            <Combobox
                                fetchOptions={async () => {
                                    const response = await standardService.getAllCombobox();
                                    return response.Data || [];
                                }}
                                value={standardId}
                                onValueChange={setStandardId}
                                placeholder="Chọn tiêu chuẩn"
                                searchPlaceholder="Tìm kiếm tiêu chuẩn..."
                                emptyText="Không tìm thấy tiêu chuẩn"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Mã tiêu chí</Label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="VD: 1.1, 1.2, 2.1"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Tên tiêu chí</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VD: Mục tiêu của chương trình đào tạo"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Mô tả</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Nhập mô tả chi tiết về tiêu chí..."
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Hướng dẫn</Label>
                            <Textarea
                                value={guidance}
                                onChange={(e) => setGuidance(e.target.value)}
                                rows={4}
                                placeholder="Nhập hướng dẫn thực hiện tiêu chí..."
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
                        {!criterion?.IsEdit && (
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

export default PopupCriterion;
