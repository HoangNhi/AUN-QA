import { fireEvent, render, screen } from "@testing-library/react";
import { flexRender } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import {
  ActionPlanStatus,
  type ActionPlanListItem,
} from "@/features/business/types/actionPlan.types";
import { getActionPlanColumns } from "./columns";

function makeItem(
  overrides: Partial<ActionPlanListItem> = {},
): ActionPlanListItem {
  return {
    Id: "plan-1",
    CycleId: "cycle-1",
    CycleName: "Chu kỳ 2026",
    Year: 2026,
    Title: "Kế hoạch test",
    Description: null,
    Priority: 2,
    Deadline: "2026-12-31T00:00:00.000Z",
    Status: ActionPlanStatus.Draft,
    AssigneeCount: 0,
    TotalTaskCount: 0,
    DoneTaskCount: 0,
    ...overrides,
  };
}

function renderActionsCell(item: ActionPlanListItem) {
  const columns = getActionPlanColumns(vi.fn(), vi.fn());
  const actions = columns.find((column) => column.id === "actions");

  if (!actions?.cell) {
    throw new Error("Actions cell template is not configured");
  }

  const cell = flexRender(actions.cell, {
    row: { original: item },
  } as never);

  render(<>{cell}</>);
}

describe("ActionPlan columns actions", () => {
  it("renders overflow menu trigger instead of direct open button", () => {
    renderActionsCell(makeItem());

    expect(
      screen.getByRole("button", { name: /open menu/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mở" }),
    ).not.toBeInTheDocument();
  });

  it("shows delete option for Draft status", () => {
    renderActionsCell(makeItem({ Status: ActionPlanStatus.Draft }));
    const trigger = screen.getByRole("button", { name: /open menu/i });
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(screen.getByText("Xóa")).toBeInTheDocument();
  });

  it("hides delete option for non-Draft status", () => {
    renderActionsCell(makeItem({ Status: ActionPlanStatus.InProgress }));
    const trigger = screen.getByRole("button", { name: /open menu/i });
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(screen.queryByText("Xóa")).not.toBeInTheDocument();
  });
});
