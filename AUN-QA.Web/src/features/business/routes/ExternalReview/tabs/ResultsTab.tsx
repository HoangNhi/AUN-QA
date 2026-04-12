import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ModelCombobox } from "@/types/base/base.types";
import type {
  AddExternalReviewFindingRequest,
  ExternalReviewResult,
  UpdateExternalReviewFindingRequest,
} from "@/features/business/types/externalReview.types";

const FINDING_TYPE_OPTIONS = [
  { Value: "0", Text: "Can cai tien" },
  { Value: "1", Text: "Kien nghi" },
];

interface ResultsTabProps {
  standards: ModelCombobox[];
  results: ExternalReviewResult[];
  isSubmitting: boolean;
  isReadOnly: boolean;
  onUpsertResult: (payload: { standardId: string; strengths?: string | null }) => Promise<void>;
  onAddFinding: (payload: AddExternalReviewFindingRequest) => Promise<void>;
  onUpdateFinding: (payload: UpdateExternalReviewFindingRequest) => Promise<void>;
  onDeleteFinding: (findingId: string) => Promise<void>;
}

export function ResultsTab({
  standards,
  results,
  isSubmitting,
  isReadOnly,
  onUpsertResult,
  onAddFinding,
  onUpdateFinding,
  onDeleteFinding,
}: ResultsTabProps) {
  const [selectedStandardId, setSelectedStandardId] = useState<string>("");
  const [strengths, setStrengths] = useState<string>("");
  const [newFindingType, setNewFindingType] = useState<string>("0");
  const [newFindingContent, setNewFindingContent] = useState<string>("");
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string>("0");
  const [editingContent, setEditingContent] = useState<string>("");

  useEffect(() => {
    if (!selectedStandardId && standards[0]?.Value) {
      setSelectedStandardId(standards[0].Value);
    }
  }, [selectedStandardId, standards]);

  const selectedResult = useMemo(
    () => results.find((item) => item.StandardId === selectedStandardId) || null,
    [results, selectedStandardId],
  );

  useEffect(() => {
    setStrengths(selectedResult?.Strengths || "");
  }, [selectedResult]);

  useEffect(() => {
    if (isReadOnly) {
      setEditingFindingId(null);
      setEditingType("0");
      setEditingContent("");
    }
  }, [isReadOnly]);

  const findingRows = selectedResult?.Findings || [];

  const saveResult = async () => {
    if (!selectedStandardId || isReadOnly) {
      return;
    }

    await onUpsertResult({
      standardId: selectedStandardId,
      strengths: strengths.trim() || null,
    });
  };

  const addFinding = async () => {
    if (!selectedResult?.Id || !newFindingContent.trim() || isReadOnly) {
      return;
    }

    await onAddFinding({
      ExternalReviewResultId: selectedResult.Id,
      FindingType: Number(newFindingType),
      Content: newFindingContent.trim(),
      CriterionId: null,
    });

    setNewFindingContent("");
  };

  const startEditFinding = (findingId: string, findingType: number, content: string) => {
    setEditingFindingId(findingId);
    setEditingType(String(findingType));
    setEditingContent(content);
  };

  const cancelEditFinding = () => {
    setEditingFindingId(null);
    setEditingType("0");
    setEditingContent("");
  };

  const saveFinding = async () => {
    if (!editingFindingId || !editingContent.trim() || isReadOnly) {
      return;
    }

    await onUpdateFinding({
      FindingId: editingFindingId,
      FindingType: Number(editingType),
      Content: editingContent.trim(),
      CriterionId: null,
    });
    cancelEditFinding();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ket qua External Review theo tieu chuan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <Combobox
            options={standards}
            value={selectedStandardId}
            onValueChange={(value) => setSelectedStandardId(value)}
            placeholder="Chon tieu chuan"
            searchPlaceholder="Tim tieu chuan..."
            emptyText="Khong co tieu chuan."
          />
          {!isReadOnly ? (
            <Button type="button" onClick={() => void saveResult()} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              Luu ket qua
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Diem manh</p>
          <Textarea
            rows={4}
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
            placeholder="Nhap diem manh cho tieu chuan dang chon..."
            disabled={isSubmitting || !selectedStandardId || isReadOnly}
          />
        </div>

        {!isReadOnly ? (
          <div className="rounded-md border p-4">
            <p className="mb-3 text-sm font-medium">Them phat hien moi</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto]">
              <Combobox
                options={FINDING_TYPE_OPTIONS}
                value={newFindingType}
                onValueChange={(value) => setNewFindingType(value)}
                placeholder="Loai phat hien"
              />
              <Input
                value={newFindingContent}
                onChange={(event) => setNewFindingContent(event.target.value)}
                placeholder="Nhap noi dung phat hien..."
                disabled={!selectedResult?.Id || isSubmitting}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void addFinding();
                }}
                disabled={!selectedResult?.Id || !newFindingContent.trim() || isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Them
              </Button>
            </div>
            {!selectedResult?.Id ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Can luu ket qua tieu chuan truoc khi them phat hien.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-md border">
          {findingRows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Chua co phat hien cho tieu chuan dang chon.
            </div>
          ) : (
            <div className="divide-y">
              {findingRows.map((finding) => {
                const isEditing = editingFindingId === finding.Id;
                return (
                  <div key={finding.Id} className="space-y-3 p-3">
                    {isEditing ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
                        <Combobox
                          options={FINDING_TYPE_OPTIONS}
                          value={editingType}
                          onValueChange={(value) => setEditingType(value)}
                          placeholder="Loai phat hien"
                          disabled={isReadOnly}
                        />
                        <Input
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          placeholder="Noi dung phat hien..."
                          disabled={isReadOnly}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {
                            FINDING_TYPE_OPTIONS.find(
                              (item) => item.Value === String(finding.FindingType),
                            )?.Text
                          }
                        </p>
                        <p className="text-sm">{finding.Content}</p>
                      </div>
                    )}

                    {!isReadOnly ? (
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelEditFinding}
                              disabled={isSubmitting}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Huy
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                void saveFinding();
                              }}
                              disabled={!editingContent.trim() || isSubmitting}
                            >
                              <Save className="mr-1 h-4 w-4" />
                              Luu
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                startEditFinding(
                                  finding.Id,
                                  finding.FindingType,
                                  finding.Content,
                                )
                              }
                              disabled={isSubmitting}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Sua
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                void onDeleteFinding(finding.Id);
                              }}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Xoa
                            </Button>
                          </>
                        )}
                      </div>
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
