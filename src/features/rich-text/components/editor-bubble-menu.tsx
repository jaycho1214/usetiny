"use client";

import { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { type Editor, useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface EditorBubbleMenuProps {
  editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor.isActive("bold"),
      isItalic: editor.isActive("italic"),
      isUnderline: editor.isActive("underline"),
      isStrike: editor.isActive("strike"),
      isCode: editor.isActive("code"),
      isHighlight: editor.isActive("highlight"),
      isSub: editor.isActive("subscript"),
      isSuper: editor.isActive("superscript"),
      isLink: editor.isActive("link"),
      currentLink: (editor.getAttributes("link").href as string) ?? "",
      canAlign: editor.isActive("heading") || editor.isActive("paragraph"),
      alignLeft: editor.isActive({ textAlign: "left" }),
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      alignJustify: editor.isActive({ textAlign: "justify" }),
    }),
  });

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const openLinkPopover = (open: boolean) => {
    if (open) setLinkValue(state.currentLink);
    setLinkOpen(open);
  };

  const applyLink = () => {
    const href = linkValue.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const normalized = /^https?:\/\//i.test(href) ? href : `https://${href}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: normalized })
        .run();
    }
    setLinkOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ offset: 6, placement: "top" }}
      shouldShow={({ editor, from, to }) => {
        if (from === to) return false;
        if (editor.isActive("image")) return false;
        if (editor.isActive("codeBlock")) return false;
        return editor.isEditable;
      }}
    >
      <div className="flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md">
        <BubbleButton
          active={state.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold className="size-3.5" />
        </BubbleButton>
        <BubbleButton
          active={state.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic className="size-3.5" />
        </BubbleButton>
        <BubbleButton
          active={state.isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="Underline"
        >
          <Underline className="size-3.5" />
        </BubbleButton>
        <BubbleButton
          active={state.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="Strikethrough"
        >
          <Strikethrough className="size-3.5" />
        </BubbleButton>
        <BubbleButton
          active={state.isCode}
          onClick={() => editor.chain().focus().toggleCode().run()}
          label="Inline code"
        >
          <Code className="size-3.5" />
        </BubbleButton>
        <BubbleButton
          active={state.isHighlight}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          label="Highlight"
        >
          <Highlighter className="size-3.5" />
        </BubbleButton>
        <BubbleButton
          active={state.isSub}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          label="Subscript"
        >
          <SubscriptIcon className="size-3.5" />
        </BubbleButton>
        <BubbleButton
          active={state.isSuper}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          label="Superscript"
        >
          <SuperscriptIcon className="size-3.5" />
        </BubbleButton>
        <Popover open={linkOpen} onOpenChange={openLinkPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-active={state.isLink}
              className="h-7 w-7 data-[active=true]:bg-accent"
              aria-label="Link"
            >
              <LinkIcon className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="w-72 p-2">
            <div className="flex items-center gap-1">
              <Input
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                }}
                placeholder="https://example.com"
                className="h-8"
              />
              <Button size="sm" className="h-8" onClick={applyLink}>
                Apply
              </Button>
              {state.isLink && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={removeLink}
                >
                  Remove
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {state.canAlign && (
          <>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <BubbleButton
              active={state.alignLeft}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              label="Align left"
            >
              <AlignLeft className="size-3.5" />
            </BubbleButton>
            <BubbleButton
              active={state.alignCenter}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              label="Align center"
            >
              <AlignCenter className="size-3.5" />
            </BubbleButton>
            <BubbleButton
              active={state.alignRight}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              label="Align right"
            >
              <AlignRight className="size-3.5" />
            </BubbleButton>
            <BubbleButton
              active={state.alignJustify}
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              label="Justify"
            >
              <AlignJustify className="size-3.5" />
            </BubbleButton>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}

interface BubbleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

function BubbleButton({ active, onClick, label, children }: BubbleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      data-active={active}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "h-7 w-7",
        "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
      )}
    >
      {children}
    </Button>
  );
}
