import { describe, expect, it } from "vitest";
import type { InternalReviewListItem } from "@/features/business/types/internalreview.types";
import { canDecideInternalReview } from "./PopupInternalReview";

function createItem(
  overrides: Partial<InternalReviewListItem> = {},
): InternalReviewListItem {
  return {
    SarReportId: "sar-1",
    CycleId: "cycle-1",
    CycleName: "Cycle 1",
    Year: 2026,
    Status: 2,
    ReviewRound: 1,
    CommentCount: 0,
    ...overrides,
  };
}

describe("canDecideInternalReview", () => {
  it.each([
    [null, false],
    [createItem({ Status: 1, CanApproveByRole: true }), false],
    [createItem({ Status: 2, CanApproveByRole: false }), false],
    [createItem({ Status: 2, CanApproveByRole: null }), false],
    [createItem({ Status: 2, CanApproveByRole: true }), true],
  ])("returns %s => %s", (item, expected) => {
    expect(canDecideInternalReview(item as InternalReviewListItem | null)).toBe(expected);
  });
});
