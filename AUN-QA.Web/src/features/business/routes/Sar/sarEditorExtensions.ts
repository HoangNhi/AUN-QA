import type { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import type * as Y from "yjs";

export function createSarEditorExtensions(ydoc: Y.Doc | null): AnyExtension[] {
  const extensions: AnyExtension[] = [
    StarterKit.configure({
      history: !ydoc,
    }),
  ];

  if (ydoc) {
    extensions.push(
      Collaboration.configure({
        document: ydoc,
      }),
    );
  }

  return extensions;
}
