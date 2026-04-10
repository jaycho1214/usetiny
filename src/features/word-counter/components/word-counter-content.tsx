"use client";

import { useWordCounterStore } from "../store";
import { useKeyboardShortcuts } from "./keyboard-shortcuts";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Keyboard } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { toast } from "sonner";

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatReadingTime(words: number): string {
  if (words === 0) return "0 min";
  if (words < 238) return "< 1 min";
  return `~${Math.ceil(words / 238)} min`;
}

function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value);
  toast("Copied");
}

interface StatProps {
  value: string;
  label: string;
  rawValue: string;
}

function HeroStat({ value, label, rawValue }: StatProps) {
  return (
    <button
      type="button"
      onClick={() => copyToClipboard(rawValue)}
      aria-label={`Copy ${label}: ${rawValue}`}
      className="text-left px-5 py-6 border-b transition-colors hover:bg-accent cursor-pointer"
    >
      <div className="text-4xl font-bold tabular-nums tracking-tight">
        {value}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
        {label}
      </div>
    </button>
  );
}

function StatItem({ value, label, rawValue }: StatProps) {
  return (
    <button
      type="button"
      onClick={() => copyToClipboard(rawValue)}
      aria-label={`Copy ${label}: ${rawValue}`}
      className="text-left px-5 py-3 border-b last:border-b-0 transition-colors hover:bg-accent cursor-pointer"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
      </div>
    </button>
  );
}

function MobileStatItem({ value, label, rawValue }: StatProps) {
  return (
    <button
      type="button"
      onClick={() => copyToClipboard(rawValue)}
      aria-label={`Copy ${label}: ${rawValue}`}
      className="text-left rounded-md px-2 py-1.5 transition-colors hover:bg-accent cursor-pointer"
    >
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </button>
  );
}

export default function WordCounterContent() {
  const text = useWordCounterStore((s) => s.text);
  const setText = useWordCounterStore((s) => s.setText);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleShowShortcuts = useCallback(() => setShowShortcuts(true), []);
  useKeyboardShortcuts(textareaRef, handleShowShortcuts);
  const rehydrated = useStoreHydration(useWordCounterStore);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.length;
    const noSpaces = text.replace(/\s/g, "").length;
    const sentences = trimmed
      ? (text.match(/[.!?]+(?:\s|$)/g) || []).length ||
        (trimmed.length > 0 ? 1 : 0)
      : 0;
    const paragraphs = trimmed
      ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length ||
        (trimmed.length > 0 ? 1 : 0)
      : 0;
    return { words, characters, noSpaces, sentences, paragraphs };
  }, [text]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= 1000000) {
        setText(newValue);
      } else {
        toast.error("Content limit reached (1MB)");
      }
    },
    [setText],
  );

  const statItems = useMemo(() => {
    const readingTime = formatReadingTime(stats.words);
    return [
      {
        value: formatNumber(stats.words),
        label: "words",
        rawValue: String(stats.words),
      },
      {
        value: formatNumber(stats.characters),
        label: "characters",
        rawValue: String(stats.characters),
      },
      {
        value: formatNumber(stats.noSpaces),
        label: "no spaces",
        rawValue: String(stats.noSpaces),
      },
      {
        value: formatNumber(stats.sentences),
        label: "sentences",
        rawValue: String(stats.sentences),
      },
      {
        value: formatNumber(stats.paragraphs),
        label: "paragraphs",
        rawValue: String(stats.paragraphs),
      },
      { value: readingTime, label: "reading time", rawValue: readingTime },
    ];
  }, [stats]);

  if (!rehydrated) {
    return <FullscreenLoading />;
  }

  const isEmpty = text.length === 0;

  return (
    <div className="h-dvh flex flex-col">
      {/* Navbar */}
      <div className="bg-background px-4 py-2 flex items-center gap-2 border-b">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Word Counter
        </span>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowShortcuts(true)}
              className="h-7 w-7"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <KbdGroup>
              <Kbd>?</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Textarea section */}
        <div className="flex-1 flex flex-col max-w-prose mx-auto w-full px-6 pt-8 pb-4">
          {isEmpty && (
            <p className="text-sm text-muted-foreground/50 mb-6 leading-relaxed select-none">
              Paste or type text to count words.
              <br />
              Everything stays in your browser.
            </p>
          )}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            className="flex-1 w-full resize-none outline-none bg-transparent text-base leading-relaxed placeholder:text-muted-foreground/40"
            placeholder="Paste your text here..."
            autoFocus
          />
        </div>

        {/* Stats panel — desktop */}
        <div className="hidden md:flex flex-col w-56 border-l">
          <HeroStat {...statItems[0]} />
          {statItems.slice(1).map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Stats grid — mobile */}
      <div className="md:hidden border-t px-4 py-3 grid grid-cols-3 gap-1">
        {statItems.map((stat) => (
          <MobileStatItem key={stat.label} {...stat} />
        ))}
      </div>

      {/* Status bar */}
      <div className="bg-background px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-3 border-t">
        <span className="opacity-60">Saved</span>
      </div>

      <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}
