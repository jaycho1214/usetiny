"use client";

import { type Editor, useEditorState } from "@tiptap/react";

interface EditorStatsProps {
  editor: Editor | null;
}

export function EditorStats({ editor }: EditorStatsProps) {
  const stats = useEditorState({
    editor,
    selector: ({ editor }) => {
      const cc = editor?.storage.characterCount;
      return {
        chars: cc?.characters() ?? 0,
        words: cc?.words() ?? 0,
      };
    },
  });

  return (
    <>
      <span>{stats?.words ?? 0} words</span>
      <span>{stats?.chars ?? 0} chars</span>
    </>
  );
}
