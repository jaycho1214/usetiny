"use client";

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabTitleInputProps {
  tabId: string;
  title: string;
  index: number;
  isActive: boolean;
  isMac: boolean;
  titleInputRef: RefObject<HTMLInputElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onTitleChange: (tabId: string, title: string) => void;
  onDelete: (tabId: string) => void;
  variant?: "compact" | "sidebar";
}

export function TabTitleInput({
  tabId,
  title,
  index,
  isActive,
  isMac,
  titleInputRef,
  textareaRef,
  onTitleChange,
  onDelete,
  variant = "compact",
}: TabTitleInputProps) {
  const isSidebar = variant === "sidebar";
  return (
    <>
      <input
        ref={isActive ? titleInputRef : null}
        value={title}
        maxLength={100}
        onChange={(e) => {
          e.stopPropagation();
          onTitleChange(tabId, e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            textareaRef.current?.focus();
          }
        }}
        className={cn(
          "bg-transparent outline-none text-sm",
          isSidebar ? "flex-1 min-w-0" : "w-24",
        )}
        placeholder="Untitled"
      />
      {index < 9 && (
        <Kbd
          className={cn(
            "text-[10px] px-1 py-0",
            isSidebar && "shrink-0 opacity-50",
          )}
        >
          {isMac ? "⌘" : isSidebar ? "^" : "Ctrl+"}
          {index + 1}
        </Kbd>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(tabId);
        }}
        className={cn(
          "p-0 hover:bg-destructive/20",
          isSidebar
            ? "h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            : "h-4 w-4 -mr-1",
        )}
      >
        <X className="h-3 w-3" />
      </Button>
    </>
  );
}
