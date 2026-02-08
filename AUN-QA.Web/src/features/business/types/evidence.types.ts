import type { Attachment } from "@/features/file/types/uploadfile.types";
import type { BaseRequest, GetListPagingRequest } from "@/types/base/base.types";

export interface Evidence extends BaseRequest {
    Id: string;
    Name: string;
    Code: string;
    Status: number; // 1=Draft, 2=Pending, 3=Verified, 4=Rejected
    IssueDate?: string;
    IssuingAuthority?: string;
    ExpiryDate?: string;
    FileTypeId: string;
    Description?: string;
    RejectionReason?: string;
    CycleId: string;
    AttachmentIds?: string[];
    ListAttachment?: Attachment[];
}

// For list responses with resolved names
export interface EvidenceGetListPaging extends Evidence {
    StatusName?: string;
    FileTypeName?: string;
    CycleName?: string;
}

// Request type for filtering
export interface EvidenceGetListPagingRequest extends GetListPagingRequest {
    Status?: number;
    CycleId?: string;
    FileTypeId?: string;
}

// EvidenceCycleMap - junction table linking evidence to cycles and criteria
export interface EvidenceCycleMap extends BaseRequest {
    Id: string;
    EvidenceId: string;
    CycleId: string;
    CriterionId: string;
    ReviewStatus: number; // 1=NotStarted, 2=InProgress, 3=Completed
    FinalDecisionBy?: string;
    FinalDecisionAt?: string;
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