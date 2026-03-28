import type { GetListPagingRequest } from "@/types/base/base.types";

export interface SarGetListPagingRequest extends GetListPagingRequest {
  Status?: number;
}

export interface SarGetListItem {
  SarReportId: string;
  CycleId: string;
  CycleName: string;
  Year: number;
  Status: number;
  LastSavedAt?: string | null;
  UpdatedAt?: string | null;
  UpdatedBy?: string | null;
}

export interface SarDraft {
  SarReportId: string;
  CycleId: string;
  Status: number;
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
