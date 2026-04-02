import type { GetListPagingRequest } from "@/types/base/base.types";

export type SarStatus = 1 | 2 | 3 | 4;

export interface SarGetListPagingRequest extends GetListPagingRequest {
  Status?: SarStatus;
  CycleId?: string;
}

export interface SarGetListItem {
  SarReportId: string;
  CycleId: string;
  CycleName: string;
  Year: number;
  Status: SarStatus;
  LastSavedAt?: string | null;
  UpdatedAt?: string | null;
  UpdatedBy?: string | null;
  EvaluationPurpose?: string;
}

export interface SarDraft {
  SarReportId: string;
  CycleId: string;
  Status: SarStatus;
  YDocSnapshotBase64?: string | null;
  RenderedHtml?: string | null;
  LastSavedAt?: string | null;
  CreatedAt: string;
  CreatedBy: string;
  UpdatedAt?: string | null;
  UpdatedBy?: string | null;
}

export interface GetSarByCycleRequest {
  CycleId: string;
}

export interface SaveSarDraftRequest {
  CycleId: string;
  YDocSnapshotBase64?: string | null;
  RenderedHtml?: string | null;
}
