import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVE_STATUS_OPTIONS } from "@/constants/catalog.constants";
import type { FileType } from "@/features/catalog/types/filetype.types";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  id: z.string(),
  code: z.string().min(1, "MÃ£ loáº¡i file lÃ  báº¯t buá»™c"),
  name: z.string().min(2, "TÃªn pháº£i tá»« 2-200 kÃ½ tá»±").max(200, "TÃªn pháº£i tá»« 2-200 kÃ½ tá»±"),
  description: z.string().optional(),
  isActived: z.boolean(),
});

const PopupFileType = ({
  fileType,
  isOpen,
  onOpenChange,
  saveChange,
  isLoading,
}: {
  fileType: FileType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (
    fileType: FileType & { IsEdit: boolean },
    isAddMore: boolean,
  ) => void;
  isLoading?: boolean;
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: fileType?.Id || uuidv4(),
      code: fileType?.Code || "",
      name: fileType?.Name || "",
      description: fileType?.Description || "",
      isActived: fileType?.IsActived ?? true,
    },
  });

  useEffect(() => {
    if (fileType) {
      form.reset({
        id: fileType.Id || uuidv4(),
        code: fileType.Code || "",
        name: fileType.Name || "",
        description: fileType.Description || "",
        isActived: fileType.IsActived ?? true,
      });
    } else {
      form.reset({
        id: uuidv4(),
        code: "",
        name: "",
        description: "",
        isActived: true,
      });
    }
  }, [fileType, form]);

  const onSubmit = (values: z.infer<typeof formSchema>, isAddMore: boolean) => {
    const payload = {
      Id: values.id,
      Code: values.code.trim(),
      Name: values.name.trim(),
      Description: values.description?.trim() || "",
      IsActived: values.isActived,
      IsEdit: fileType?.IsEdit || false,
      FolderUpload: "",
    };
    saveChange(payload as FileType & { IsEdit: boolean }, isAddMore);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <Form {...form}>
          <form
            id="fileType-form"
            onSubmit={form.handleSubmit((data) => onSubmit(data, false))}
            noValidate
          >
            <DialogHeader>
              <DialogTitle>
                {fileType?.IsEdit ? "Cập nhật Loáº¡i File" : "Thêm mới Loáº¡i File"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      MÃ£ loáº¡i file
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nhập mÃ£ loáº¡i file" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      TÃªn loáº¡i file
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nhập tÃªn loáº¡i file" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Nhập mÃ´ táº£ loáº¡i file"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <FormControl>
                      <Combobox
                        options={ACTIVE_STATUS_OPTIONS}
                        value={field.value.toString()}
                        onValueChange={(val) => field.onChange(val === "true")}
                        placeholder="Chá»n tráº¡ng thÃ¡i"
                        searchPlaceholder="Tìm kiếm tráº¡ng thÃ¡i..."
                        emptyText="Không tìm thấy tráº¡ng thÃ¡i."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Hủy</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu
              </Button>
              {!fileType?.IsEdit && (
                <Button
                  type="button"
                  onClick={form.handleSubmit((data) => onSubmit(data, true))}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu vÃ  thÃªm tiáº¿p
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupFileType;

