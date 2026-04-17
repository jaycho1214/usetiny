"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { allTools } from "@/lib/tools";
import { markAllNewToolsSeen } from "@/lib/new-tools-ack";
import { cn } from "@/lib/utils";

const SURVEY_ID = "019d7073-2cb6-0000-7914-626198509c6b";
const RESPONSE_KEY = "$survey_response_948e0419-c1dc-4b8f-9bbc-b227c2ebe21f";

function getPostHog() {
  return import("posthog-js").then((m) => m.default);
}

export function CommandPalette() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [listWrapper, setListWrapper] = useState<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredTools = useMemo(() => {
    if (!search) return allTools;
    const q = search.toLowerCase();
    return allTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q),
    );
  }, [search]);

  const noResults = filteredTools.length === 0 && search.length > 0;

  const submitRequest = useCallback(async (query: string) => {
    setCommandOpen(false);
    try {
      const ph = await getPostHog();
      ph.capture(
        "survey sent",
        { $survey_id: SURVEY_ID, [RESPONSE_KEY]: query },
        { send_instantly: true },
      );
      toast.success("Request submitted — thanks!");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (noResults) {
      getPostHog().then((ph) =>
        ph.capture("survey shown", { $survey_id: SURVEY_ID }),
      );
    }
  }, [noResults]);

  useEffect(() => {
    if (commandOpen) markAllNewToolsSeen();
  }, [commandOpen]);

  useEffect(() => {
    if (!listWrapper) return;
    const el = listWrapper.querySelector<HTMLDivElement>(
      '[data-slot="command-list"]',
    );
    if (!el) return;
    const update = () => {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop <= 1;
      setCanScrollUp(!atTop);
      setCanScrollDown(!atBottom);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [listWrapper, filteredTools.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !commandOpen) {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape" && commandOpen) {
        setCommandOpen(false);
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
    <Dialog
      open={commandOpen}
      onOpenChange={(open) => {
        setCommandOpen(open);
        if (open) setSearch("");
      }}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>Command Palette</DialogTitle>
        <DialogDescription>Search for a tool to use...</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        <Command
          shouldFilter={false}
          className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <div className="relative">
            <CommandInput
              ref={inputRef}
              placeholder="Search tools..."
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter" && noResults) {
                  e.preventDefault();
                  submitRequest(search);
                }
              }}
            />
            {noResults && (
              <button
                type="button"
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => submitRequest(search)}
              >
                Request
                <kbd className="pointer-events-none flex size-4 items-center justify-center rounded border bg-background">
                  <CornerDownLeft className="size-2.5" />
                </kbd>
              </button>
            )}
          </div>
          <div className="relative" ref={setListWrapper}>
            <CommandList>
              {noResults ? (
                <div className="flex items-center justify-center gap-1.5 py-6 text-center text-sm text-muted-foreground">
                  Tool not available yet. Press
                  <kbd className="inline-flex size-4 items-center justify-center rounded border bg-muted">
                    <CornerDownLeft className="size-2.5" />
                  </kbd>
                  to request.
                </div>
              ) : (
                <CommandGroup>
                  {filteredTools.map((tool) => (
                    <CommandItem
                      key={tool.href}
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
              )}
            </CommandList>
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-popover via-popover/80 to-transparent transition-opacity duration-300",
                canScrollUp ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-popover via-popover/80 to-transparent transition-opacity duration-300",
                canScrollDown ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
