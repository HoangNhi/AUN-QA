import { ActionPlanStatus } from "@/features/business/types/actionPlan.types";

export function getActionPlanStatusLabel(status: number): string {
  switch (status) {
    case ActionPlanStatus.Draft:
      return "Nháp";
    case ActionPlanStatus.InProgress:
      return "Đang thực hiện";
    case ActionPlanStatus.PendingReview:
      return "Chờ xác nhận";
    case ActionPlanStatus.Completed:
      return "Hoàn thành";
    default:
      return "Không xác định";
  }
}

export function getActionPlanStatusColor(status: number): string {
  switch (status) {
    case ActionPlanStatus.Draft:
      return "bg-slate-100 text-slate-700";
    case ActionPlanStatus.InProgress:
      return "bg-blue-100 text-blue-700";
    case ActionPlanStatus.PendingReview:
      return "bg-amber-100 text-amber-700";
    case ActionPlanStatus.Completed:
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

export function canEditActionPlan(status: number): boolean {
  return status === ActionPlanStatus.Draft || status === ActionPlanStatus.PendingReview;
}

export function canChangeStatus(councilRoleId: number): boolean {
  return councilRoleId === 1 || councilRoleId === 2;
}

export const ACTION_PLAN_STATUS_OPTIONS = [
  { value: ActionPlanStatus.Draft, label: "Nháp" },
  { value: ActionPlanStatus.InProgress, label: "Đang thực hiện" },
  { value: ActionPlanStatus.PendingReview, label: "Chờ xác nhận" },
  { value: ActionPlanStatus.Completed, label: "Hoàn thành" },
];
