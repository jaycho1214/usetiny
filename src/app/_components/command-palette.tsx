"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { allTools } from "@/lib/tools";

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
          {allTools.map((tool) => (
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
