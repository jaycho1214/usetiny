"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as actions from "../actions";
import { LIMITS } from "../lib/ops";
import { PALETTE, PALETTE_KEYS } from "../palette";
import { useTimeblockStore } from "../store";
import type { Category } from "../types";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDialog({ open, onOpenChange }: CategoryDialogProps) {
  const categories = useTimeblockStore((s) => s.categories);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>Blocks in a deleted category show as Uncategorized.</DialogDescription>
        </DialogHeader>
        <div className="-mx-1 max-h-[50vh] space-y-1.5 overflow-y-auto px-1 py-0.5">
          {categories.map((c) => (
            // Keyed by name too, so an undo or rename resets the field.
            <CategoryRow key={`${c.id}:${c.name}`} category={c} canDelete={categories.length > 1} />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={categories.length >= LIMITS.categories}
          onClick={() => actions.addCategory()}
        >
          <Plus /> Add category
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRow({ category, canDelete }: { category: Category; canDelete: boolean }) {
  const [name, setName] = useState(category.name);
  const commitName = () => {
    if (name.trim()) actions.updateCategory(category.id, { name }, "Rename category");
    else setName(category.name);
  };
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label={`Change color of ${category.name}`}>
            <span className="size-3.5 rounded-full" style={{ backgroundColor: PALETTE[category.color] }} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="grid min-w-0 grid-cols-6 gap-1 p-2">
          {PALETTE_KEYS.map((key) => (
            <DropdownMenuItem
              key={key}
              aria-label={key}
              className={cn("size-7 justify-center p-0", category.color === key && "ring-2 ring-ring")}
              onSelect={() => actions.updateCategory(category.id, { color: key }, "Change color")}
            >
              <span className="size-4 rounded-full" style={{ backgroundColor: PALETTE[key] }} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Input
        value={name}
        maxLength={40}
        aria-label="Category name"
        className="h-8"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${category.name}`}
        disabled={!canDelete}
        onClick={() => actions.deleteCategory(category.id)}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
