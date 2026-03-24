export type EvaluationStatus = 0 | 1 | 2 | 3;

export const EVALUATION_STATUS = {
  EMPTY: 0,
  DRAFT: 1,
  WAITING: 2,
  APPROVED: 3,
} as const;

export const EVALUATION_STATUS_CONFIG: Record<
  EvaluationStatus,
  { label: string; color: string }
> = {
  0: { label: "Trống", color: "bg-gray-100 text-gray-500" },
  1: { label: "Nháp", color: "bg-yellow-100 text-yellow-700" },
  2: { label: "Chờ duyệt", color: "bg-orange-100 text-orange-700" },
  3: { label: "Đã duyệt", color: "bg-green-100 text-green-700" },
};

export type FrameworkType = "AUN" | "MOET";

export interface CriterionEvaluationSummary {
  TotalCriteria: number;
  ApprovedCriteria: number;
  PrerequisiteTotal: number;
  PrerequisitePassed: number;
  FailedStandards: number;
  FailedCriteria: number;
}

export interface CriterionEvaluationItem {
  Id: string;
  CriterionId: string;
  CriterionCode: string;
  CriterionName: string;
  IsPrerequisite: boolean;
  Status: EvaluationStatus;
  OfficialScore: number | null;
  OfficialResult: boolean | null;
  EvidenceCount: number;
  MissingEvidenceCount: number;
  SubmissionCount: number;
  TotalEvaluators: number;
}

export interface StandardEvaluationGroup {
  StandardId: string;
  StandardCode: string;
  StandardName: string;
  IsPassed: boolean;
  StandardScore: number | null;
  ApprovedCount: number;
  TotalCount: number;
  Items: CriterionEvaluationItem[];
}

export interface EvaluationSubmission {
  Id: string;
  EvaluatorId: string;
  EvaluatorName: string;
  CurrentState: string | null;
  Strengths: string | null;
  Weaknesses: string | null;
  ActionPlan: string | null;
  ProposedScore: number | null;
  ProposedResult: boolean | null;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface EvaluationSubmissionRequest {
  Id?: string;
  CriterionEvaluationId: string;
  CurrentState?: string;
  Strengths?: string;
  Weaknesses?: string;
  ActionPlan?: string;
  ProposedScore?: number | null;
  ProposedResult?: boolean | null;
}

export interface ApproveEvaluationRequest {
  CriterionEvaluationId: string;
  OfficialScore?: number | null;
  OfficialResult?: boolean | null;
}

export interface CriterionEvaluationGetListRequest {
  CycleId: string;
  StandardSetId: string;
  TextSearch?: string;
  Status?: EvaluationStatus;
}

export interface GetCriterionEvaluationSummaryRequest {
  CycleId: string;
  StandardSetId: string;
}

export interface InitializeCycleEvaluationRequest {
  CycleId: string;
  StandardSetId: string;
}

export interface CriterionEvidence {
  Id: string;
  Code: string;
  Name: string;
}
