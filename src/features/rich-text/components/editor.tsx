"use client";

import "../editor.css";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  EditorContent,
  useEditor,
  type Editor as TiptapEditor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount, Focus, Placeholder } from "@tiptap/extensions";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Youtube from "@tiptap/extension-youtube";
import {
  Details,
  DetailsSummary,
  DetailsContent,
} from "@tiptap/extension-details";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { SlashCommand } from "./slash-command";

export interface EditorHandle {
  focus: () => void;
  isFocused: () => boolean;
  getEditor: () => TiptapEditor | null;
}

interface EditorProps {
  tabId: string;
  initialContent: JSONContent | null;
  onUpdate: (json: JSONContent) => void;
  onReady?: (editor: TiptapEditor) => void;
  placeholder?: string;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { tabId, initialContent, onUpdate, onReady, placeholder },
  ref,
) {
  const onUpdateRef = useRef(onUpdate);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingJson = useRef<JSONContent | null>(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const flushPending = useCallback(() => {
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    if (pendingJson.current) {
      onUpdateRef.current(pendingJson.current);
      pendingJson.current = null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ controls: true, nocookie: true }),
      Details.configure({
        persist: true,
        HTMLAttributes: { class: "rt-details" },
      }),
      DetailsSummary,
      DetailsContent,
      Placeholder.configure({
        placeholder: placeholder ?? "Start typing, or press / for blocks…",
      }),
      CharacterCount.configure({ limit: 1_000_000 }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      Focus.configure({ className: "rt-focused", mode: "all" }),
      SlashCommand,
    ],
    content: initialContent ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none " +
          "flex-1 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      pendingJson.current = editor.getJSON();
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(() => {
        if (pendingJson.current) {
          onUpdateRef.current(pendingJson.current);
          pendingJson.current = null;
        }
      }, 250);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor?.commands.focus(),
      isFocused: () => editor?.isFocused ?? false,
      getEditor: () => editor,
    }),
    [editor],
  );

  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  const lastSyncedTabId = useRef<string | null>(null);
  useEffect(() => {
    if (!editor) return;
    if (lastSyncedTabId.current === tabId) return;
    flushPending();
    editor.commands.setContent(initialContent ?? "", { emitUpdate: false });
    lastSyncedTabId.current = tabId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, editor]);

  useEffect(() => {
    const flush = () => flushPending();
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [flushPending]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} className="flex flex-1 flex-col" />
    </>
  );
});
