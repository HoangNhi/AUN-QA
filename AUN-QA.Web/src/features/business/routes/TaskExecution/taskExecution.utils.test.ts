import { describe, expect, it } from "vitest";
import { canDeleteTask, getTaskStatusLabel } from "./taskExecution.utils";

describe("taskExecution utils", () => {
  it("maps in-progress status to Vietnamese label", () => {
    expect(getTaskStatusLabel(2)).toBe("Đang thực hiện");
  });

  it("allows delete only for todo", () => {
    expect(canDeleteTask(1)).toBe(true);
    expect(canDeleteTask(2)).toBe(false);
    expect(canDeleteTask(3)).toBe(false);
  });
});
