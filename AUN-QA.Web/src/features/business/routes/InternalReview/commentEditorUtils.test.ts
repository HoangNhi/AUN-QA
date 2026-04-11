import type { Editor } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { findTextRange, getOccurrenceIndex } from "./commentEditorUtils";

type FakeTextNode = {
  isText: true;
  text: string;
};

type FakeDescendant = {
  node: FakeTextNode;
  pos: number;
  parent?: object | null;
};

function createEditor(descendants: FakeDescendant[]) {
  return {
    state: {
      doc: {
        descendants(
          callback: (
            node: FakeTextNode,
            pos: number,
            parent?: object | null,
          ) => boolean | void,
        ) {
          descendants.forEach(({ node, pos, parent }) => {
            callback(node, pos, parent ?? null);
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

  it("returns the second occurrence when occurrenceIndex is 1", () => {
    const editor = createEditor([
      { node: { isText: true, text: "Match here" }, pos: 0 },
      { node: { isText: true, text: "Match here too" }, pos: 20 },
    ]);

    expect(findTextRange(editor, "Match", 1)).toEqual({ from: 20, to: 25 });
  });

  it("returns null when occurrenceIndex exceeds available occurrences", () => {
    const editor = createEditor([{ node: { isText: true, text: "Match here" }, pos: 0 }]);

    expect(findTextRange(editor, "Match", 5)).toBeNull();
  });

  it("returns null when no match exists", () => {
    const editor = createEditor([
      { node: { isText: true, text: "Alpha" }, pos: 0 },
      { node: { isText: true, text: "Beta" }, pos: 10 },
    ]);

    expect(findTextRange(editor, "Gamma")).toBeNull();
  });

  it("finds text across paragraph boundaries", () => {
    const firstParagraph = { type: { isBlock: true } };
    const secondParagraph = { type: { isBlock: true } };

    const editor = createEditor([
      { node: { isText: true, text: "Paragraph one" }, pos: 0, parent: firstParagraph },
      { node: { isText: true, text: "Paragraph two" }, pos: 20, parent: secondParagraph },
    ]);

    expect(findTextRange(editor, "one paragraph two")).toEqual({ from: 10, to: 33 });
  });
});

describe("getOccurrenceIndex", () => {
  it("returns 0 for the first occurrence", () => {
    const editor = createEditor([
      { node: { isText: true, text: "Match here" }, pos: 0 },
      { node: { isText: true, text: "Match there" }, pos: 20 },
    ]);

    expect(getOccurrenceIndex(editor, "Match", 0)).toBe(0);
  });

  it("returns 1 for the second occurrence", () => {
    const editor = createEditor([
      { node: { isText: true, text: "Match here" }, pos: 0 },
      { node: { isText: true, text: "Match there" }, pos: 20 },
    ]);

    expect(getOccurrenceIndex(editor, "Match", 20)).toBe(1);
  });

  it("returns 0 as fallback when fromPosition does not match any occurrence", () => {
    const editor = createEditor([{ node: { isText: true, text: "Hello world" }, pos: 0 }]);

    expect(getOccurrenceIndex(editor, "Hello", 999)).toBe(0);
  });
});
