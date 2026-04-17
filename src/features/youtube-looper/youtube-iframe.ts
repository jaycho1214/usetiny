/* eslint-disable @typescript-eslint/no-explicit-any */

export interface YTPlayer {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  getVideoData: () => { title: string; video_id: string };
  destroy: () => void;
}

type YTGlobal = {
  Player: new (
    el: HTMLElement | string,
    options: {
      videoId?: string;
      playerVars?: Record<string, any>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number; target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
};

let ytPromise: Promise<YTGlobal> | null = null;

export function loadYouTubeAPI(): Promise<YTGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser"));
  }
  const w = window as unknown as {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  };
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (ytPromise) return ytPromise;

  ytPromise = new Promise<YTGlobal>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(w.YT as YTGlobal);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });
  return ytPromise;
}

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;
