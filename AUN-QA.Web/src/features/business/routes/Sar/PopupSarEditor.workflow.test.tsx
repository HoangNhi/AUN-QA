import { describe, expect, it } from "vitest";
import {
  canSubmitSar,
  isSarEditorReadOnly,
  createSarEvidenceListRequest,
  shouldShowSarRevisionReasonBanner,
} from "./PopupSarEditor";

describe("PopupSarEditor workflow helpers", () => {
  it.each([
    [1, false],
    [2, true],
    [3, false],
    [4, true],
  ] as const)("marks status %s as read-only=%s", (status, expected) => {
    expect(isSarEditorReadOnly(status)).toBe(expected);
  });

  it.each([
    [1, true, true],
    [1, false, false],
    [2, true, false],
    [3, true, true],
    [3, false, false],
    [4, true, false],
  ] as const)(
    "allows submit for status %s with role permission %s => %s",
    (status, canSubmitByRole, expected) => {
      expect(canSubmitSar(status, canSubmitByRole)).toBe(expected);
    },
  );

  it.each([
    [3, "Need more evidence.", true],
    [3, "   ", false],
    [2, "Need more evidence.", false],
    [4, "Need more evidence.", false],
    [3, null, false],
  ] as const)(
    "shows revision banner for status %s and reason %s => %s",
    (status, revisionReason, expected) => {
      expect(
        shouldShowSarRevisionReasonBanner(status, revisionReason),
      ).toBe(expected);
    },
  );

  it("builds the verified evidence query for the current SAR cycle", () => {
    expect(createSarEvidenceListRequest("cycle-123")).toEqual({
      PageIndex: 1,
      PageSize: 1000,
      TextSearch: "",
      CycleId: "cycle-123",
      EvidenceStatus: 3,
    });
  });
});
