"use client";

import { Ellipsis, Eraser, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Template, WeekStartsOn } from "../types";
import type { Mode } from "./timeblock-navbar";

interface TemplatePickerProps {
  templates: Template[];
  value: string | null;
  onChange: (id: string) => void;
  onNew: () => void;
}

export function TemplatePicker({ templates, value, onChange, onNew }: TemplatePickerProps) {
  if (templates.length === 0) {
    return (
      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={onNew}>
        <Plus className="h-3.5 w-3.5" /> New template
      </Button>
    );
  }
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-full text-xs data-[size=sm]:h-7 md:w-48" aria-label="Template">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {templates.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ApplyTemplateMenuProps {
  templates: Template[];
  onApply: (template: Template) => void;
  onCreate: () => void;
}

/** `modal={false}` so a Dialog opened from an item doesn't fight the menu's focus trap. */
export function ApplyTemplateMenu({ templates, onApply, onCreate }: ApplyTemplateMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" aria-label="Apply template">
          <LayoutTemplate className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Apply template</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Apply to this week
        </DropdownMenuLabel>
        {templates.length === 0 ? (
          <DropdownMenuItem onSelect={onCreate}>
            <Plus /> Create a template…
          </DropdownMenuItem>
        ) : (
          templates.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => onApply(t)}>
              <span className="truncate">{t.name}</span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">{t.blocks.length}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MoreMenuProps {
  mode: Mode;
  weekHasBlocks: boolean;
  hasTemplate: boolean;
  weekStartsOn: WeekStartsOn;
  onSaveWeek: () => void;
  onClearWeek: () => void;
  onNewTemplate: () => void;
  onRenameTemplate: () => void;
  onDeleteTemplate: () => void;
  onWeekStartsOnChange: (value: WeekStartsOn) => void;
}

export function MoreMenu({
  mode,
  weekHasBlocks,
  hasTemplate,
  weekStartsOn,
  onSaveWeek,
  onClearWeek,
  onNewTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onWeekStartsOnChange,
}: MoreMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="h-7 w-7" aria-label="More actions">
          <Ellipsis className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {mode === "week" ? (
          <>
            <DropdownMenuItem disabled={!weekHasBlocks} onSelect={onSaveWeek}>
              <LayoutTemplate /> Save week as template…
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!weekHasBlocks} variant="destructive" onSelect={onClearWeek}>
              <Eraser /> Clear week
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={onNewTemplate}>
              <Plus /> New template…
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!hasTemplate} onSelect={onRenameTemplate}>
              <Pencil /> Rename template…
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!hasTemplate} variant="destructive" onSelect={onDeleteTemplate}>
              <Trash2 /> Delete template…
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Week starts on</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(weekStartsOn)}
          onValueChange={(v) => onWeekStartsOnChange(v === "0" ? 0 : 1)}
        >
          <DropdownMenuRadioItem value="1">Monday</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="0">Sunday</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TemplatesEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LayoutTemplate />
        </EmptyMedia>
        <EmptyTitle>No templates yet</EmptyTitle>
        <EmptyDescription>
          Design a typical week once — deep work, meetings, workouts — then apply it to any week. You can also save a
          week you&apos;ve already planned.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={onCreate}>
          <Plus /> New template
        </Button>
      </EmptyContent>
    </Empty>
  );
}
