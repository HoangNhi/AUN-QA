import { useMemo, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useUserOptions } from "@/features/system/hooks/useUserOptions";
import type { ExternalReviewAccount } from "@/features/business/types/externalReview.types";

interface AccountTabProps {
  externalReviewId?: string;
  accounts: ExternalReviewAccount[];
  isSubmitting: boolean;
  isReadOnly: boolean;
  onAddAccounts: (userIds: string[]) => Promise<void>;
  onRemoveAccount: (accountId: string) => Promise<void>;
}

export function AccountTab({
  externalReviewId,
  accounts,
  isSubmitting,
  isReadOnly,
  onAddAccounts,
  onRemoveAccount,
}: AccountTabProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { options: userOptions, isLoading: isUserOptionsLoading } = useUserOptions(
    !!externalReviewId,
  );

  const selectableUsers = useMemo(() => {
    const selectedIds = new Set(accounts.map((item) => item.UserId));
    return userOptions.filter((item) => !selectedIds.has(item.Value || ""));
  }, [accounts, userOptions]);

  const handleAdd = async () => {
    if (!selectedUserId) {
      return;
    }

    await onAddAccounts([selectedUserId]);
    setSelectedUserId("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cau hinh tai khoan doan danh gia ngoai</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <Combobox
            options={selectableUsers}
            loading={isUserOptionsLoading}
            value={selectedUserId}
            onValueChange={(value) => setSelectedUserId(value)}
            placeholder="Chon tai khoan de them"
            searchPlaceholder="Tim tai khoan..."
            emptyText="Khong con tai khoan phu hop."
            disabled={!externalReviewId || isReadOnly}
          />
          <Button
            type="button"
            onClick={() => {
              void handleAdd();
            }}
            disabled={!externalReviewId || !selectedUserId || isSubmitting || isReadOnly}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Them tai khoan
          </Button>
        </div>

        <div className="rounded-md border">
          {accounts.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Chua co tai khoan nao trong danh sach danh gia ngoai.
            </div>
          ) : (
            <div className="divide-y">
              {accounts.map((account) => {
                const displayName =
                  account.Fullname || account.Username || account.UserId;
                return (
                  <div
                    key={account.Id || account.UserId}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {account.Username || account.UserId}
                      </p>
                    </div>
                    {!isReadOnly ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          void onRemoveAccount(account.Id);
                        }}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
