import type {
  BaseRequest,
  GetListPagingRequest,
} from "@/types/base/base.types";
import type { Evidence } from "./evidence.types";

// EvidenceCycleMap - junction table linking evidence to cycles and criteria
export interface EvidenceCycleMap extends BaseRequest {
  Id: string;
  EvidenceId: string;
  CycleId: string;
  ReviewStatus: number; // 1=NotStarted, 2=InProgress, 3=Completed
  FinalDecisionBy?: string;
  FinalDecisionAt?: string;

  // Nested Evidence object (used in create/update operations)
  Evidence?: Evidence;
}

// For list responses with resolved names (maps backend underscore naming to camelCase)
// Backend: Evidence_Name, Evidence_Code, Evidence_Status → Frontend: evidenceName, evidenceCode, evidenceStatus
export interface EvidenceCycleMapGetListPaging extends BaseRequest {
  Id: string;
  EvidenceId: string;
  CycleId: string;
  ReviewStatus: number;
  FinalDecisionBy?: string;
  FinalDecisionAt?: string;
  evidenceName?: string; // Backend: Evidence_Name
  evidenceCode?: string; // Backend: Evidence_Code
  evidenceStatus?: number; // Backend: Evidence_Status
  cycleName?: string; // Backend: CycleName
}

// Request type for filtering
export interface EvidenceCycleMapGetListPagingRequest extends GetListPagingRequest {
  ReviewStatus?: number;
  CycleId?: string;
  EvidenceStatus?: number;
}

// For criteria mapping in the popup form
export interface CriterionMapping {
  Id: string;
  StandardId: string;
  StandardName: string;
  StandardSetName: string;
  CriterionId: string;
  CriterionName: string;
  CriterionCode: string;
}

export interface SubmitToApproveRequest {
  Ids: string[];
}

export interface ApproveRequest {
  Id: string;
  EvidenceStatus: number;
  RejectionReason?: string;
}
