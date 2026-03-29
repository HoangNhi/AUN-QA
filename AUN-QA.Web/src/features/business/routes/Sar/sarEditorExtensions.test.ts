import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createSarEditorExtensions } from "./sarEditorExtensions";

describe("createSarEditorExtensions", () => {
  it("always returns a non-empty extension list so editor schema has top nodes", () => {
    const extensions = createSarEditorExtensions(null);
    expect(extensions.length).toBeGreaterThan(0);
  });

  it("adds collaboration extension when ydoc is available", () => {
    const extensions = createSarEditorExtensions(new Y.Doc());
    expect(extensions.some((extension) => extension.name === "collaboration")).toBe(true);
  });
});

