'use client';

// YouTube IFrame Player embed that reports back actual elapsed `PLAYING`
// time. We don't track this for any quality-control purpose on YouTube's
// side — we use it to make sure the worker actually watched a chunk of
// the video before submitting (anti-rush).
//
// API ref: https://developers.google.com/youtube/iframe_api_reference

import { useEffect, useRef, useState } from 'react';

// Minimal typing for the parts of the IFrame API we touch.
interface YTPlayer {
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
}
interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadIframeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  });
  return apiPromise;
}

export interface YoutubeEmbedProps {
  videoId: string;
  /** Called every 500ms with cumulative elapsed PLAYING seconds. */
  onPlayingTick?: (elapsed: number) => void;
  /** Called when the video ends. */
  onEnded?: () => void;
}

export function YoutubeEmbed({ videoId, onPlayingTick, onEnded }: YoutubeEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef<boolean>(false);
  const elapsedRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: (e) => {
            const state = e.data;
            playingRef.current = state === YT.PlayerState.PLAYING;
            if (state === YT.PlayerState.ENDED) onEnded?.();
          },
        },
      });
    });

    intervalRef.current = setInterval(() => {
      if (playingRef.current && document.visibilityState === 'visible') {
        elapsedRef.current += 0.5;
        onPlayingTick?.(elapsedRef.current);
      }
    }, 500);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
    };
    // videoId is stable for the lifetime of a study — no need to re-init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-ink aspect-video">
      <div ref={containerRef} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full" />
      {!isReady && (
        <div className="absolute inset-0 grid place-items-center text-fg-muted text-sm">
          Loading player…
        </div>
      )}
    </div>
  );
}
