"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Keyboard, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type Mode = "week" | "templates";

const MODES: { value: Mode; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "templates", label: "Templates" },
];

interface TimeblockNavbarProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  /** Week navigation or template picker; wraps to its own row on mobile. */
  center: ReactNode;
  /** Extra right-side controls, rendered before the shortcuts button. */
  actions: ReactNode;
  undoLabel?: string;
  redoLabel?: string;
  onUndo: () => void;
  onRedo: () => void;
  modKey: string;
  onShowShortcuts: () => void;
}

export function TimeblockNavbar({
  mode,
  onModeChange,
  center,
  actions,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
  modKey,
  onShowShortcuts,
}: TimeblockNavbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2">
      <Link
        href="/"
        className="text-sm font-semibold transition-opacity hover:opacity-70"
      >
        UseTiny
      </Link>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        Timeblock
      </span>
      <ButtonGroup className="ml-1">
        {MODES.map((m) => (
          <Button
            key={m.value}
            size="sm"
            variant={mode === m.value ? "default" : "outline"}
            className="h-7 px-2.5 text-xs"
            aria-pressed={mode === m.value}
            onClick={() => onModeChange(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </ButtonGroup>
      <div className="order-last flex w-full min-w-0 items-center gap-1 md:order-none md:ml-1 md:w-auto">
        {center}
      </div>
      <div className="flex-1" />
      <NavIconButton
        label={undoLabel ? `Undo ${undoLabel.toLowerCase()}` : "Nothing to undo"}
        keys={[modKey, "Z"]}
        disabled={!undoLabel}
        onClick={onUndo}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </NavIconButton>
      <NavIconButton
        label={redoLabel ? `Redo ${redoLabel.toLowerCase()}` : "Nothing to redo"}
        keys={[modKey, "Shift", "Z"]}
        disabled={!redoLabel}
        onClick={onRedo}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </NavIconButton>
      {actions}
      <NavIconButton
        label="Keyboard shortcuts"
        keys={["?"]}
        onClick={onShowShortcuts}
        className="hidden sm:inline-flex"
      >
        <Keyboard className="h-3.5 w-3.5" />
      </NavIconButton>
    </div>
  );
}

interface NavIconButtonProps {
  label: string;
  keys?: string[];
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

export function NavIconButton({
  label,
  keys,
  disabled,
  onClick,
  className,
  children,
}: NavIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn("h-7 w-7", className)}
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        <span>{label}</span>
        {keys && (
          <KbdGroup>
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface WeekNavProps {
  label: string;
  /** Already on today (this week, or today's column in the single-day view): Today is disabled. */
  showingToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNav({ label, showingToday, onPrev, onNext, onToday }: WeekNavProps) {
  return (
    <>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Previous week" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className="min-w-0 flex-1 truncate text-center text-sm font-medium tabular-nums md:min-w-48 md:flex-none"
        aria-live="polite"
      >
        {label}
      </span>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Next week" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="ml-1 h-7 px-2.5 text-xs"
        disabled={showingToday}
        onClick={onToday}
      >
        Today
      </Button>
    </>
  );
}
