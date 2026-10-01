"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Template } from "../types";

const blocksLabel = (n: number) => `${n} ${n === 1 ? "block" : "blocks"}`;

interface NameDialogProps {
  title: string;
  description: string;
  placeholder: string;
  initialName: string;
  confirmLabel: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** Mount only while open so the field starts fresh each time. */
export function NameDialog({
  title,
  description,
  placeholder,
  initialName,
  confirmLabel,
  onSubmit,
  onCancel,
}: NameDialogProps) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            placeholder={placeholder}
            maxLength={60}
            aria-label="Template name"
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!trimmed}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ApplyTemplateDialogProps {
  template: Template;
  weekLabel: string;
  weekHasBlocks: boolean;
  onApply: (how: "replace" | "add") => void;
  onCancel: () => void;
}

export function ApplyTemplateDialog({ template, weekLabel, weekHasBlocks, onApply, onCancel }: ApplyTemplateDialogProps) {
  const count = blocksLabel(template.blocks.length);
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply “{template.name}”</DialogTitle>
          <DialogDescription>
            {weekHasBlocks
              ? `${weekLabel} already has blocks. Add the template's ${count} alongside them, or replace the week.`
              : `Add ${count} to ${weekLabel}.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {weekHasBlocks && (
            <Button variant="outline" onClick={() => onApply("add")}>
              Add to week
            </Button>
          )}
          <Button onClick={() => onApply(weekHasBlocks ? "replace" : "add")}>
            {weekHasBlocks ? "Replace week" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteTemplateDialogProps {
  template: Template;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTemplateDialog({ template, onConfirm, onCancel }: DeleteTemplateDialogProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{template.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Weeks you already applied it to keep their blocks. You can undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
