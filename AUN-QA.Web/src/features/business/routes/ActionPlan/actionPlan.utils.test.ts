import { describe, expect, it } from "vitest";
import { ActionPlanStatus } from "@/features/business/types/actionPlan.types";
import {
  ACTION_PLAN_STATUS_OPTIONS,
  canChangeStatus,
  canEditActionPlan,
  getActionPlanStatusColor,
  getActionPlanStatusLabel,
} from "./actionPlan.utils";

describe("getActionPlanStatusLabel", () => {
  it("returns Vietnamese labels for each status", () => {
    expect(getActionPlanStatusLabel(ActionPlanStatus.Draft)).toBe("Nháp");
    expect(getActionPlanStatusLabel(ActionPlanStatus.InProgress)).toBe("Đang thực hiện");
    expect(getActionPlanStatusLabel(ActionPlanStatus.PendingReview)).toBe("Chờ xác nhận");
    expect(getActionPlanStatusLabel(ActionPlanStatus.Completed)).toBe("Hoàn thành");
    expect(getActionPlanStatusLabel(99)).toBe("Không xác định");
  });
});

describe("getActionPlanStatusColor", () => {
  it("returns a color class for each status", () => {
    expect(getActionPlanStatusColor(ActionPlanStatus.Draft)).toContain("slate");
    expect(getActionPlanStatusColor(ActionPlanStatus.InProgress)).toContain("blue");
    expect(getActionPlanStatusColor(ActionPlanStatus.PendingReview)).toContain("amber");
    expect(getActionPlanStatusColor(ActionPlanStatus.Completed)).toContain("emerald");
  });
});

describe("canEditActionPlan", () => {
  it("allows editing only for draft and pending review", () => {
    expect(canEditActionPlan(ActionPlanStatus.Draft)).toBe(true);
    expect(canEditActionPlan(ActionPlanStatus.PendingReview)).toBe(true);
    expect(canEditActionPlan(ActionPlanStatus.InProgress)).toBe(false);
    expect(canEditActionPlan(ActionPlanStatus.Completed)).toBe(false);
  });
});

describe("canChangeStatus", () => {
  it("allows status change only for HeadOfCouncil and ViceChairman", () => {
    expect(canChangeStatus(1)).toBe(true);
    expect(canChangeStatus(2)).toBe(true);
    expect(canChangeStatus(3)).toBe(false);
    expect(canChangeStatus(4)).toBe(false);
    expect(canChangeStatus(0)).toBe(false);
  });
});

describe("ACTION_PLAN_STATUS_OPTIONS", () => {
  it("contains four workflow states", () => {
    expect(ACTION_PLAN_STATUS_OPTIONS).toHaveLength(4);
  });
});
