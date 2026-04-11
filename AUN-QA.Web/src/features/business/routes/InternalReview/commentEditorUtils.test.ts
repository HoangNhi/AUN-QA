import type { Editor } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { findTextRange } from "./commentEditorUtils";

type FakeTextNode = {
  isText: true;
  text: string;
};

type FakeDescendant = {
  node: FakeTextNode;
  pos: number;
};

function createEditor(descendants: FakeDescendant[]) {
  return {
    state: {
      doc: {
        descendants(callback: (node: FakeTextNode, pos: number) => boolean | void) {
          descendants.forEach(({ node, pos }) => {
            callback(node, pos);
          });
        },
      },
    },
  } as unknown as Editor;
}

describe("findTextRange", () => {
  it("returns null for empty text", () => {
    const editor = createEditor([{ node: { isText: true, text: "Hello" }, pos: 0 }]);

    expect(findTextRange(editor, "")).toBeNull();
  });

  it("returns null for whitespace-only text", () => {
    const editor = createEditor([{ node: { isText: true, text: "Hello" }, pos: 0 }]);

    expect(findTextRange(editor, "   ")).toBeNull();
  });

  it("finds text case-insensitively", () => {
    const editor = createEditor([
      { node: { isText: true, text: "Intro" }, pos: 0 },
      { node: { isText: true, text: "Chuẩn đầu ra" }, pos: 6 },
    ]);

    expect(findTextRange(editor, "chuẩn đầu")).toEqual({ from: 6, to: 15 });
  });

  it("returns the first matching range", () => {
    const editor = createEditor([
      { node: { isText: true, text: "Match here" }, pos: 0 },
      { node: { isText: true, text: "Match here too" }, pos: 20 },
    ]);

    expect(findTextRange(editor, "Match")).toEqual({ from: 0, to: 5 });
  });

  it("returns null when no match exists", () => {
    const editor = createEditor([
      { node: { isText: true, text: "Alpha" }, pos: 0 },
      { node: { isText: true, text: "Beta" }, pos: 10 },
    ]);

    expect(findTextRange(editor, "Gamma")).toBeNull();
  });
});
