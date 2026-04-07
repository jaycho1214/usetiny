"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { FileText, NotepadText, QrCode } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";

const tools = [
  {
    name: "Notepad",
    description: "Distraction-free text editor with tabs",
    icon: NotepadText,
    href: "/notepad",
  },
  {
    name: "QR Generator",
    description: "Create and download QR codes instantly",
    icon: QrCode,
    href: "/qr",
  },
  {
    name: "PDF Editor",
    description: "Annotate, fill forms, and manage pages",
    icon: FileText,
    href: "/pdf-editor",
  },
];

export function CommandPalette() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !commandOpen) {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape" && commandOpen) {
        setCommandOpen(false);
        setSearch("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandOpen]);

  useLayoutEffect(() => {
    if (commandOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandOpen]);

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={(open) => {
        setCommandOpen(open);
        if (!open) setSearch("");
      }}
      showCloseButton={false}
    >
      <CommandInput
        ref={inputRef}
        placeholder="Search tools..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        <CommandGroup>
          {tools.map((tool) => (
            <CommandItem
              key={tool.href}
              keywords={tool.description.toLowerCase().split(/\s+/)}
              onSelect={() => {
                router.push(tool.href);
                setCommandOpen(false);
              }}
            >
              <tool.icon />
              <span>{tool.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
