"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Pause,
  Pencil,
  Play,
  Keyboard,
  Trash2,
  Share2,
  Save,
  Repeat,
  RotateCcw,
  FlagTriangleRight,
  Flag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { cn } from "@/lib/utils";
import { useYoutubeLooperStore, type SavedLoop } from "../store";
import { extractVideoId, formatTime, nextRate, PLAYBACK_RATES } from "../utils";
import { loadYouTubeAPI, YT_STATE, type YTPlayer } from "../youtube-iframe";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { youtubeLooperShortcutSections } from "./shortcuts";

const PLAYER_DOM_ID = "youtube-looper-player";
const LOOP_END_EPSILON = 0.05;

async function copyText(text: string): Promise<boolean> {
  try {
    window.focus();
  } catch {
    // ignore
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const exec = (document as unknown as { execCommand(cmd: string): boolean })
      .execCommand;
    const ok = exec.call(document, "copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function YoutubeLooperContent() {
  const hydrated = useStoreHydration(useYoutubeLooperStore);
  const savedLoops = useYoutubeLooperStore((s) => s.savedLoops);
  const saveLoopAction = useYoutubeLooperStore((s) => s.saveLoop);
  const deleteLoop = useYoutubeLooperStore((s) => s.deleteLoop);
  const renameLoop = useYoutubeLooperStore((s) => s.renameLoop);
  const lastVideoId = useYoutubeLooperStore((s) => s.lastVideoId);
  const setLastVideoId = useYoutubeLooperStore((s) => s.setLastVideoId);

  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoIdState] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const loopStartRef = useRef<number | null>(null);
  const loopEndRef = useRef<number | null>(null);
  const loopEnabledRef = useRef(true);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    loopStartRef.current = loopStart;
    loopEndRef.current = loopEnd;
    loopEnabledRef.current = loopEnabled;
  }, [isPlaying, loopStart, loopEnd, loopEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    const candidate = v ? extractVideoId(v) : null;
    const initialId = candidate ?? lastVideoId;
    if (initialId) {
      setVideoIdState(initialId);
    }
    const a = params.get("a");
    const b = params.get("b");
    const rate = params.get("rate");
    if (a !== null) {
      const n = Number(a);
      if (Number.isFinite(n) && n >= 0) setLoopStart(n);
    }
    if (b !== null) {
      const n = Number(b);
      if (Number.isFinite(n) && n >= 0) setLoopEnd(n);
    }
    if (rate !== null) {
      const n = Number(rate);
      if (PLAYBACK_RATES.some((r) => Math.abs(r - n) < 0.01)) {
        setPlaybackRateState(n);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Initialize YouTube player when videoId is set
  useEffect(() => {
    if (!hydrated || !videoId) return;

    let cancelled = false;
    setPlayerReady(false);
    setLastVideoId(videoId);

    loadYouTubeAPI()
      .then((YT) => {
        if (cancelled) return;
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
          playerRef.current = null;
        }
        const container = document.getElementById(PLAYER_DOM_ID);
        if (!container) return;
        container.innerHTML = "";
        const mountEl = document.createElement("div");
        mountEl.id = `${PLAYER_DOM_ID}-iframe`;
        container.appendChild(mountEl);

        playerRef.current = new YT.Player(mountEl, {
          videoId,
          playerVars: {
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              setPlayerReady(true);
              setDuration(e.target.getDuration());
              try {
                e.target.setPlaybackRate(playbackRate);
              } catch {
                // ignore
              }
              const data = e.target.getVideoData();
              setVideoTitle(data.title || "");
            },
            onStateChange: (e) => {
              if (cancelled) return;
              if (e.data === YT_STATE.PLAYING) {
                setIsPlaying(true);
                setDuration(e.target.getDuration());
                const data = e.target.getVideoData();
                if (data.title) setVideoTitle(data.title);
              } else if (
                e.data === YT_STATE.PAUSED ||
                e.data === YT_STATE.ENDED ||
                e.data === YT_STATE.CUED
              ) {
                setIsPlaying(false);
                if (e.data === YT_STATE.ENDED && loopEnabledRef.current) {
                  const start = loopStartRef.current ?? 0;
                  e.target.seekTo(start, true);
                  e.target.playVideo();
                }
              }
            },
            onError: () => {
              toast.error("Couldn't load video");
              setPlayerReady(false);
            },
          },
        });
      })
      .catch(() => {
        toast.error("Failed to load YouTube player");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, hydrated]);

  useEffect(() => {
    if (!playerReady) return;
    let lastEmittedQuarter = -1;
    const tick = () => {
      const player = playerRef.current;
      if (!player) return;
      if (!isPlayingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const t = player.getCurrentTime();
        const quarter = Math.floor(t * 4);
        if (quarter !== lastEmittedQuarter) {
          lastEmittedQuarter = quarter;
          setCurrentTime(t);
        }
        if (
          loopEnabledRef.current &&
          loopStartRef.current !== null &&
          loopEndRef.current !== null &&
          loopEndRef.current > loopStartRef.current &&
          (t >= loopEndRef.current - LOOP_END_EPSILON ||
            t < loopStartRef.current - LOOP_END_EPSILON)
        ) {
          player.seekTo(loopStartRef.current, true);
        }
      } catch {
        // ignore
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playerReady]);

  const handleLoad = useCallback(() => {
    const id = extractVideoId(urlInput);
    if (!id) {
      toast.error("Paste a valid YouTube URL or ID");
      return;
    }
    setVideoIdState(id);
    setUrlInput("");
    setLoopStart(null);
    setLoopEnd(null);
    setCurrentTime(0);
    urlInputRef.current?.blur();
  }, [urlInput]);

  const playPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlayingRef.current) player.pauseVideo();
    else player.playVideo();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const player = playerRef.current;
    if (!player) return;
    const t = Math.max(0, player.getCurrentTime() + delta);
    player.seekTo(t, true);
  }, []);

  const seekTo = useCallback((t: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(Math.max(0, t), true);
  }, []);

  const setA = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const t = player.getCurrentTime();
    setLoopStart(t);
    if (loopEndRef.current !== null && loopEndRef.current <= t) {
      setLoopEnd(null);
    }
    toast(`A · ${formatTime(t)}`);
  }, []);

  const setB = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const t = player.getCurrentTime();
    if (loopStartRef.current !== null && t <= loopStartRef.current) {
      toast.error("B must be after A");
      return;
    }
    setLoopEnd(t);
    toast(`B · ${formatTime(t)}`);
  }, []);

  const clearLoop = useCallback(() => {
    setLoopStart(null);
    setLoopEnd(null);
    toast("Loop cleared");
  }, []);

  const toggleLoop = useCallback(() => {
    setLoopEnabled((v) => {
      toast(v ? "Loop off" : "Loop on");
      return !v;
    });
  }, []);

  const jumpToA = useCallback(() => {
    if (loopStartRef.current === null) return;
    seekTo(loopStartRef.current);
  }, [seekTo]);

  const applyRate = useCallback((r: number) => {
    const player = playerRef.current;
    setPlaybackRateState(r);
    if (player) {
      try {
        player.setPlaybackRate(r);
      } catch {
        // ignore
      }
    }
  }, []);

  const bumpRate = useCallback(
    (direction: 1 | -1) => {
      const r = nextRate(playbackRate, direction);
      applyRate(r);
      toast(`${r}×`);
    },
    [playbackRate, applyRate],
  );

  const resetRate = useCallback(() => {
    applyRate(1);
    toast("1×");
  }, [applyRate]);

  const currentLoopValid =
    loopStart !== null && loopEnd !== null && loopEnd > loopStart;

  const handleSave = useCallback(() => {
    if (!videoId) {
      toast.error("Load a video first");
      return;
    }
    if (!currentLoopValid) {
      toast.error("Set A and B first");
      return;
    }
    const name = `${formatTime(loopStart!)} – ${formatTime(loopEnd!)}`;
    const saved = saveLoopAction({
      name,
      videoId,
      videoTitle: videoTitle || "Untitled",
      start: loopStart!,
      end: loopEnd!,
      speed: playbackRate,
    });
    if (!saved) {
      toast.error("Saved loops limit reached (100)");
      return;
    }
    toast.success("Loop saved");
  }, [
    videoId,
    currentLoopValid,
    loopStart,
    loopEnd,
    videoTitle,
    playbackRate,
    saveLoopAction,
  ]);

  const handleShare = useCallback(async () => {
    if (!videoId) {
      toast.error("Load a video first");
      return;
    }
    const params = new URLSearchParams({ v: videoId });
    if (loopStart !== null) params.set("a", loopStart.toFixed(2));
    if (loopEnd !== null) params.set("b", loopEnd.toFixed(2));
    if (playbackRate !== 1) params.set("rate", String(playbackRate));
    const url = `${window.location.origin}/youtube-looper?${params.toString()}`;
    if (await copyText(url)) {
      toast.success("Link copied");
    } else {
      toast.error("Couldn't copy link");
    }
  }, [videoId, loopStart, loopEnd, playbackRate]);

  const loadSavedLoop = useCallback(
    (loop: SavedLoop) => {
      setVideoIdState(loop.videoId);
      setLoopStart(loop.start);
      setLoopEnd(loop.end);
      setLoopEnabled(true);
      applyRate(loop.speed);
      // Seek after the player swaps in
      setTimeout(() => {
        seekTo(loop.start);
        playerRef.current?.playVideo();
      }, 400);
    },
    [applyRate, seekTo],
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!hydrated) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "Escape" && inInput) {
        (target as HTMLElement).blur();
        return;
      }

      if (inInput) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
        return;
      }
      if (!videoId) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          playPause();
          break;
        case "[":
          e.preventDefault();
          setA();
          break;
        case "]":
          e.preventDefault();
          setB();
          break;
        case "l":
        case "L":
          e.preventDefault();
          toggleLoop();
          break;
        case "\\":
          e.preventDefault();
          clearLoop();
          break;
        case ",":
          e.preventDefault();
          seekBy(-5);
          break;
        case ".":
          e.preventDefault();
          seekBy(5);
          break;
        case "-":
          e.preventDefault();
          bumpRate(-1);
          break;
        case "+":
        case "=":
          e.preventDefault();
          bumpRate(1);
          break;
        case "r":
        case "R":
          e.preventDefault();
          resetRate();
          break;
        case "s":
        case "S":
          e.preventDefault();
          handleSave();
          break;
        case "j":
        case "J":
          e.preventDefault();
          jumpToA();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    hydrated,
    videoId,
    playPause,
    setA,
    setB,
    toggleLoop,
    clearLoop,
    seekBy,
    bumpRate,
    resetRate,
    handleSave,
    jumpToA,
  ]);

  if (!hydrated) {
    return <FullscreenLoading />;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Navbar */}
      <div className="bg-background px-4 py-2 flex items-center gap-2 border-b">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          YouTube Looper
        </span>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowShortcuts(true)}
              className="h-7 w-7"
              aria-label="Keyboard shortcuts"
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

      {/* URL bar */}
      <div className="border-b px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLoad();
          }}
          className="max-w-5xl mx-auto flex gap-2"
        >
          <Input
            ref={urlInputRef}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a YouTube URL or ID and press Enter"
            className="flex-1"
            aria-label="YouTube URL or ID"
          />
          <Button type="submit" variant="default">
            Load
          </Button>
        </form>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto">
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          {/* Player */}
          <div className="relative w-full rounded-md overflow-hidden bg-black aspect-video">
            {videoId ? (
              <div
                id={PLAYER_DOM_ID}
                className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full"
              />
            ) : (
              <EmptyPlayer />
            )}
          </div>

          {/* Progress bar with A/B markers */}
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            loopStart={loopStart}
            loopEnd={loopEnd}
            onSeek={seekTo}
            disabled={!videoId || !playerReady}
          />

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => seekBy(-5)}
                  disabled={!playerReady}
                  aria-label="Seek back 5 seconds"
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="tabular-nums">5s</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Seek back 5s ·{" "}
                <KbdGroup>
                  <Kbd>,</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="default"
                  onClick={playPause}
                  disabled={!playerReady}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <KbdGroup>
                  <Kbd>Space</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => seekBy(5)}
                  disabled={!playerReady}
                  aria-label="Seek forward 5 seconds"
                  className="gap-1"
                >
                  <span className="tabular-nums">5s</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Seek forward 5s ·{" "}
                <KbdGroup>
                  <Kbd>.</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <div className="text-sm tabular-nums text-muted-foreground px-2 min-w-[88px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setA}
                  disabled={!playerReady}
                  className="gap-1.5"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span className="tabular-nums">
                    {loopStart !== null ? formatTime(loopStart) : "A"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Set loop start ·{" "}
                <KbdGroup>
                  <Kbd>[</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setB}
                  disabled={!playerReady}
                  className="gap-1.5"
                >
                  <FlagTriangleRight className="h-3.5 w-3.5" />
                  <span className="tabular-nums">
                    {loopEnd !== null ? formatTime(loopEnd) : "B"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Set loop end ·{" "}
                <KbdGroup>
                  <Kbd>]</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={
                    loopEnabled && currentLoopValid ? "default" : "outline"
                  }
                  onClick={toggleLoop}
                  disabled={!currentLoopValid}
                  className="gap-1.5"
                  aria-pressed={loopEnabled}
                >
                  <Repeat className="h-3.5 w-3.5" />
                  Loop
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Toggle loop ·{" "}
                <KbdGroup>
                  <Kbd>L</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={clearLoop}
                  disabled={loopStart === null && loopEnd === null}
                  aria-label="Clear loop"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Clear loop ·{" "}
                <KbdGroup>
                  <Kbd>\</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

            <Select
              value={String(playbackRate)}
              onValueChange={(v) => applyRate(Number(v))}
            >
              <SelectTrigger
                size="sm"
                className="w-[84px]"
                aria-label="Playback speed"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAYBACK_RATES.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r}×
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resetRate}
                  disabled={playbackRate === 1}
                  aria-label="Reset speed"
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Reset speed ·{" "}
                <KbdGroup>
                  <Kbd>R</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  disabled={!videoId}
                  className="gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy shareable link</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSave}
                  disabled={!currentLoopValid || !videoId}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Save loop ·{" "}
                <KbdGroup>
                  <Kbd>S</Kbd>
                </KbdGroup>
              </TooltipContent>
            </Tooltip>
          </div>

          {videoTitle && (
            <div className="text-sm text-muted-foreground truncate">
              {videoTitle}
            </div>
          )}
        </div>

        {/* Saved loops sidebar */}
        <aside className="lg:w-80 lg:border-l border-t lg:border-t-0 flex flex-col min-h-[220px]">
          <div className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
            Saved loops{" "}
            {savedLoops.length > 0 && (
              <span className="text-muted-foreground/60">
                ({savedLoops.length})
              </span>
            )}
          </div>
          {savedLoops.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6 text-center text-sm text-muted-foreground/70">
              Set A and B, then save to revisit sections later.
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {savedLoops.map((loop) => (
                <SavedLoopRow
                  key={loop.id}
                  loop={loop}
                  active={
                    loop.videoId === videoId &&
                    loopStart !== null &&
                    Math.abs(loop.start - loopStart) < 0.5 &&
                    loopEnd !== null &&
                    Math.abs(loop.end - loopEnd) < 0.5
                  }
                  onLoad={() => loadSavedLoop(loop)}
                  onDelete={() => deleteLoop(loop.id)}
                  onRename={(name) => renameLoop(loop.id, name)}
                />
              ))}
            </ul>
          )}
        </aside>
      </div>

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        description="Available shortcuts for YouTube Looper."
        sections={youtubeLooperShortcutSections}
        maxWidth={440}
      />
    </div>
  );
}

function EmptyPlayer() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/60 text-sm px-6 text-center">
      Paste a YouTube URL above to start looping.
    </div>
  );
}

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  loopStart: number | null;
  loopEnd: number | null;
  onSeek: (t: number) => void;
  disabled?: boolean;
}

function ProgressBar({
  currentTime,
  duration,
  loopStart,
  loopEnd,
  onSeek,
  disabled,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null);

  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);

  const handleSeek = (clientX: number) => {
    const bar = barRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const hasLoop = loopStart !== null && loopEnd !== null && loopEnd > loopStart;

  return (
    <div className="relative w-full py-2">
      <div
        ref={barRef}
        className={cn(
          "relative h-2 w-full rounded-full bg-muted transition-opacity",
          disabled ? "opacity-50" : "cursor-pointer",
        )}
        onClick={(e) => !disabled && handleSeek(e.clientX)}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={currentTime}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Loop region */}
        {hasLoop && (
          <div
            className="absolute top-0 h-full rounded-full bg-primary/30"
            style={{
              left: `${pct(loopStart!)}%`,
              width: `${pct(loopEnd!) - pct(loopStart!)}%`,
            }}
          />
        )}
        {/* Playhead */}
        <div
          className="absolute top-0 h-full rounded-full bg-primary"
          style={{ width: `${pct(currentTime)}%` }}
        />
        {/* A marker */}
        {loopStart !== null && (
          <div
            className="absolute -top-1 h-4 w-0.5 bg-foreground"
            style={{ left: `${pct(loopStart)}%` }}
            aria-label="Loop start"
          />
        )}
        {/* B marker */}
        {loopEnd !== null && (
          <div
            className="absolute -top-1 h-4 w-0.5 bg-foreground"
            style={{ left: `${pct(loopEnd)}%` }}
            aria-label="Loop end"
          />
        )}
      </div>
    </div>
  );
}

interface SavedLoopRowProps {
  loop: SavedLoop;
  active: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

function SavedLoopRow({
  loop,
  active,
  onLoad,
  onDelete,
  onRename,
}: SavedLoopRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(loop.name);

  const handleRowKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editing) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onLoad();
    }
  };

  return (
    <li
      className={cn(
        "group border-b last:border-0 transition-colors",
        active ? "bg-accent" : "hover:bg-accent/50",
      )}
    >
      <div
        role="button"
        tabIndex={editing ? -1 : 0}
        aria-label={`Load ${loop.name}`}
        onClick={() => {
          if (!editing) onLoad();
        }}
        onKeyDown={handleRowKey}
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                const next = draft.trim();
                if (next && next !== loop.name) onRename(next);
                else setDraft(loop.name);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setDraft(loop.name);
                  setEditing(false);
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-sm outline-none border-b border-border focus:border-primary"
            />
          ) : (
            <div className="text-sm font-medium truncate">{loop.name}</div>
          )}
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 min-w-0">
            <span className="tabular-nums shrink-0">
              {formatTime(loop.start)} – {formatTime(loop.end)}
            </span>
            {loop.speed !== 1 && (
              <span className="tabular-nums shrink-0">· {loop.speed}×</span>
            )}
            <span className="truncate">· {loop.videoTitle}</span>
          </div>
        </div>
        {!editing && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDraft(loop.name);
                    setEditing(true);
                  }}
                  aria-label={`Rename ${loop.name}`}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  aria-label={`Delete ${loop.name}`}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </li>
  );
}
