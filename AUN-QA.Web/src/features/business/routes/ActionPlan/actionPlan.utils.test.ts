import { describe, expect, it } from "vitest";
import { canEditActionPlan, getActionPlanStatusLabel } from "./actionPlan.utils";

describe("actionPlan utils", () => {
  it("maps assigned status to Vietnamese label", () => {
    expect(getActionPlanStatusLabel(5)).toBe("Đã giao");
  });

  it("allows edit only for draft or revision requested", () => {
    expect(canEditActionPlan(1)).toBe(true);
    expect(canEditActionPlan(3)).toBe(true);
    expect(canEditActionPlan(2)).toBe(false);
  });
});
