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
  CurrentUserCouncilRoleId?: number | null;
  CanSubmitByRole?: boolean;
  CanEditByRole?: boolean;
  YDocSnapshotBase64?: string | null;
  RenderedHtml?: string | null;
  RevisionReason?: string | null;
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

export interface SubmitSarRequest {
  CycleId: string;
}

export interface RequestSarRevisionRequest {
  CycleId: string;
  RevisionReason: string;
}

export interface ApproveSarRequest {
  CycleId: string;
}

export interface GetSarFeedbackRequest {
  CycleId: string;
  CriterionCode?: string | null;
  CommentType?: number | null;
}

export interface AddSarFeedbackRequest {
  CycleId: string;
  CriterionCode?: string | null;
  CommentText: string;
  CommentType?: number;
}

export interface SarFeedback {
  Id: string;
  SarReportId: string;
  CycleId: string;
  CriterionCode?: string | null;
  CommentText: string;
  CommentType: number;
  RoleId?: number | null;
  IsResolved: boolean;
  ResolvedAt?: string | null;
  ResolvedBy?: string | null;
  CreatedAt: string;
  CreatedBy: string;
  UpdatedAt?: string | null;
  UpdatedBy?: string | null;
}

export interface GetSarAutofillPayloadRequest {
  CycleId: string;
}

export interface SarAutofillPayloadDto {
  CycleId: string;
  Payload: string;
}

export interface ExportSarDocxRequest {
  CycleId: string;
}
