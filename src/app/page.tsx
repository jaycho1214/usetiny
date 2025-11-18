"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { NotepadText } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useLayoutEffect(() => {
    if (open && inputRef.current) {
      // Focus the input synchronously when dropdown opens
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="w-full min-h-dvh flex flex-col relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div
          className="w-full max-w-2xl relative transition-transform duration-300 ease-out"
          style={{
            transform: open ? "translateY(-40px)" : "translateY(0)",
          }}
        >
          {/* Title */}
          <h1 className="text-4xl font-semibold mb-4 text-center">UseTools</h1>

          {/* Command with Input - always visible */}
          <Command className="rounded-lg border shadow-md relative z-50">
            <div className="relative">
              <CommandInput
                ref={inputRef}
                placeholder="Type a command or search..."
                value={search}
                onValueChange={setSearch}
                onClick={() => setOpen(true)}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setOpen(false);
                    setSearch("");
                  }
                }}
              />
              {!open && (
                <Kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  /
                </Kbd>
              )}
            </div>
            {/* Command List - only shown when open */}
            {open && (
              <CommandList className="animate-in fade-in slide-in-from-top-2 duration-200">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Tools">
                  <CommandItem
                    keywords={["notepad", "text", "editor"]}
                    onSelect={() => router.push("/notepad")}
                  >
                    <NotepadText />
                    <span>Notepad</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </div>
      </div>
    </div>
  );
}
