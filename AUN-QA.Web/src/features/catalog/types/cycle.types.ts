import type { BaseRequest } from "@/types/base/base.types";

export interface Cycle extends BaseRequest {
    Id: string;
    Name: string;
    Year: number;
    StartDate: string;
    EndDate: string;
    Status: string;
    EvaluationPurpose: string;
    Scope: number;

    ListCouncil: Council[];
    ListEvaluationSchedule: EvaluationSchedule[];
}

export interface ModelCycleGetListPaging extends Cycle {
    StatusName: string;
}

export interface Council extends BaseRequest {
    Id: string;
    CycleId: string;
    UserId: string;
    IsLeader: boolean;
}

export interface EvaluationSchedule extends BaseRequest {
    Id: string;
    CycleId: string;
    ActivityName: string;
    StartTime: string;
    EndTime: string;
    LeadId: string;
}