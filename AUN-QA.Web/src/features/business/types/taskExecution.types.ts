import type { GetListPagingRequest, GetListPagingResponse } from "@/types/base/base.types";
import type {
  ActionPlanDetail,
  ActionPlanStatus,
  ActionPriority,
  ActionTask,
  ActionTaskAttachment,
} from "./actionPlan.types";

export interface TaskExecutionPlanListItem {
  Id: string;
  CycleId: string;
  CycleName: string;
  Year: number;
  Title: string;
  StandardId?: string | null;
  CriterionId?: string | null;
  Priority: ActionPriority | number;
  Deadline: string;
  Status: ActionPlanStatus | number;
  AssignedToNames?: string | null;
  StatusName?: string | null;
  TotalTaskCount: number;
  DoneTaskCount: number;
}

export interface TaskExecutionGetPlansRequest extends GetListPagingRequest {
  CycleId?: string | null;
}

export interface TaskExecutionGetTaskListRequest {
  ActionPlanId: string;
}

export interface TaskExecutionUpsertTaskRequest {
  Id: string;
  ActionPlanId: string;
  Description: string;
  Note?: string | null;
  TaskStatus: number;
  DueDate?: string | null;
  FolderUpload?: string | null;
}

export interface TaskExecutionDeleteTaskRequest {
  TaskId: string;
}

export interface TaskExecutionUploadAttachmentRequest {
  TaskId: string;
  FolderUpload: string;
}

export interface TaskExecutionDeleteAttachmentRequest {
  AttachmentId: string;
}

export interface TaskExecutionAttachment extends ActionTaskAttachment {}

export interface TaskExecutionTask extends ActionTask {}

export type TaskExecutionPlanDetail = ActionPlanDetail;
export type TaskExecutionPlanListResponse = GetListPagingResponse<TaskExecutionPlanListItem>;
