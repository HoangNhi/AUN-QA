import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  CriterionEvaluationItem,
  FrameworkType,
  StandardEvaluationGroup,
} from "../../../types/criterionEvaluation.types";
import { CriteriaGrid } from "./CriteriaGrid";

function buildItem(
  partial: Partial<CriterionEvaluationItem>,
): CriterionEvaluationItem {
  return {
    Id: partial.Id ?? "criterion-1",
    CriterionId: partial.CriterionId ?? "criterion-base-1",
    CriterionCode: partial.CriterionCode ?? "1.1",
    CriterionName: partial.CriterionName ?? "Criterion Name",
    IsPrerequisite: partial.IsPrerequisite ?? false,
    Status: partial.Status ?? 0,
    OfficialScore: partial.OfficialScore ?? null,
    OfficialResult: partial.OfficialResult ?? null,
    EvidenceCount: partial.EvidenceCount ?? 0,
    MissingEvidenceCount: partial.MissingEvidenceCount ?? 0,
    SubmissionCount: partial.SubmissionCount ?? 0,
    TotalEvaluators: partial.TotalEvaluators ?? 0,
  };
}

function buildGroups(
  framework: FrameworkType,
  item: CriterionEvaluationItem,
): StandardEvaluationGroup[] {
  return [
    {
      StandardId: "std-1",
      StandardCode: "Tiêu chuẩn 1",
      StandardName: "Kết quả học tập mong đợi",
      IsPassed: framework === "AUN" ? true : !!item.OfficialResult,
      StandardScore: framework === "AUN" ? 4 : null,
      ApprovedCount: 1,
      TotalCount: 1,
      Items: [item],
    },
  ];
}

describe("CriteriaGrid result column", () => {
  it("always shows 'Kết quả' as last column header", () => {
    const groups = buildGroups(
      "AUN",
      buildItem({ Status: 3, OfficialScore: 4, OfficialResult: null }),
    );

    render(<CriteriaGrid groups={groups} framework="AUN" onRowClick={vi.fn()} />);

    expect(screen.getByText("Kết quả")).toBeInTheDocument();
    expect(screen.queryByText("Điểm")).not.toBeInTheDocument();
  });

  it("shows MOET final result as ĐẠT when approved", () => {
    const groups = buildGroups(
      "MOET",
      buildItem({ Status: 3, OfficialScore: null, OfficialResult: true }),
    );

    render(<CriteriaGrid groups={groups} framework="MOET" onRowClick={vi.fn()} />);

    expect(screen.getByText("ĐẠT")).toBeInTheDocument();
  });

  it("shows AUN score text when approved", () => {
    const groups = buildGroups(
      "AUN",
      buildItem({ Status: 3, OfficialScore: 6, OfficialResult: null }),
    );

    render(<CriteriaGrid groups={groups} framework="AUN" onRowClick={vi.fn()} />);

    expect(screen.getByText("6/7")).toBeInTheDocument();
  });
});
