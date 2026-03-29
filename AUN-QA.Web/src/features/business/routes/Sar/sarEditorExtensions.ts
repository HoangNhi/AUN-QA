import type { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TableOfContents from "@tiptap/extension-table-of-contents";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import Image from "@tiptap/extension-image";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

export interface TocItem {
  id: string;
  level: number;
  text: string;
  dom: HTMLElement | null;
  isActive: boolean;
  isScrolledOver: boolean;
}

export function createSarEditorExtensions(
  ydoc: Y.Doc | null,
  provider?: WebsocketProvider | null,
  onTocUpdate?: (items: TocItem[]) => void,
  userInfo?: { name: string; color: string },
): AnyExtension[] {
  const extensions: AnyExtension[] = [
    StarterKit.configure({
      history: ydoc ? false : {},
    }),
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer",
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({
      HTMLAttributes: {
        style: "max-width: 100%; height: auto; display: block;",
      },
    }),
  ];

  if (onTocUpdate) {
    extensions.push(
      TableOfContents.configure({
        onUpdate: (data: TableOfContentData) => {
          onTocUpdate(
            data.map((item) => ({
              id: item.id,
              level: item.level,
              text: item.textContent,
              dom: item.dom,
              isActive: item.isActive,
              isScrolledOver: item.isScrolledOver,
            })),
          );
        },
      }),
    );
  }

  if (ydoc) {
    extensions.push(
      Collaboration.configure({
        document: ydoc,
      }),
    );

    if (provider) {
      extensions.push(
        CollaborationCursor.configure({
          provider,
          user: {
            name: userInfo?.name ?? null,
            color: userInfo?.color ?? null,
          },
        }),
      );
    }
  }

  return extensions;
}
