import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  Permission,
  PermissionRequest,
} from "@/features/system/types/role.types";
import { usePermissionForm } from "@/features/system/hooks/usePermissionForm";

const PopupPermission = ({
  data,
  isOpen,
  onOpenChange,
  saveChange,
}: {
  data: Permission[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveChange: (data: PermissionRequest[]) => void;
}) => {
  const { permissions, handlePermissionChange, onSubmit } = usePermissionForm(
    data,
    saveChange
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-6xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Cập nhật phân quyền</DialogTitle>
          </DialogHeader>

          <div className="flex w-full flex-col gap-6">
            {permissions.length > 0 && (
              <Tabs defaultValue={permissions[0]?.SystemGroup}>
                <TabsList className="flex-wrap h-auto">
                  {permissions.map((item) => (
                    <TabsTrigger
                      key={item.SystemGroup}
                      value={item.SystemGroup}
                    >
                      {item.SystemGroup}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {permissions.map((item) => (
                  <TabsContent key={item.SystemGroup} value={item.SystemGroup}>
                    <div className="grid gap-4 py-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[300px]">Menu</TableHead>
                              <TableHead className="text-center">Xem</TableHead>
                              <TableHead className="text-center">
                                Thêm
                              </TableHead>
                              <TableHead className="text-center">Sửa</TableHead>
                              <TableHead className="text-center">Xóa</TableHead>
                              <TableHead className="text-center">
                                Duyệt
                              </TableHead>
                              <TableHead className="text-center">
                                Thống kê
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.Roles.map((menu) => (
                              <TableRow key={menu.MenuId}>
                                <TableCell className="font-medium">
                                  {menu.Name}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    disabled={!menu.CanView}
                                    checked={menu.IsViewed}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        item.SystemGroup,
                                        menu.MenuId,
                                        "IsViewed",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    disabled={!menu.CanAdd}
                                    checked={menu.IsAdded}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        item.SystemGroup,
                                        menu.MenuId,
                                        "IsAdded",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    disabled={!menu.CanUpdate}
                                    checked={menu.IsUpdated}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        item.SystemGroup,
                                        menu.MenuId,
                                        "IsUpdated",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    disabled={!menu.CanDelete}
                                    checked={menu.IsDeleted}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        item.SystemGroup,
                                        menu.MenuId,
                                        "IsDeleted",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    disabled={!menu.CanApprove}
                                    checked={menu.IsApproved}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        item.SystemGroup,
                                        menu.MenuId,
                                        "IsApproved",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    disabled={!menu.CanAnalyze}
                                    checked={menu.IsAnalyzed}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        item.SystemGroup,
                                        menu.MenuId,
                                        "IsAnalyzed",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupPermission;
