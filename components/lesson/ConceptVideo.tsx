'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  poster?: string;
  caption?: string;
  /** Fires once playback passes the halfway mark. */
  onWatched?: () => void;
}

/**
 * Native video with the default chrome hidden and themed controls on top,
 * so the player matches the panels around it in every theme.
 */
export default function ConceptVideo({
  src,
  poster,
  caption,
  onWatched,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTime = () => {
      setProgress(el.currentTime);
      if (!fired.current && el.duration && el.currentTime / el.duration > 0.5) {
        fired.current = true;
        onWatched?.();
      }
    };
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [onWatched]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Number(e.target.value);
    setProgress(el.currentTime);
  };

  return (
    <figure className="anime-panel overflow-hidden">
      <video
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="block w-full bg-black"
        onClick={toggle}
      />

      <div className="flex items-center gap-4 border-t-2 border-[var(--line)] bg-[var(--surface-alt)] px-4 py-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="anime-chip flex h-9 w-9 shrink-0 items-center justify-center text-xs"
        >
          {playing ? '❚❚' : '▶'}
        </button>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={progress}
          onChange={seek}
          aria-label="Seek"
          className="h-1.5 w-full cursor-pointer appearance-none bg-[var(--line)] accent-[var(--accent)]"
        />

        <span className="shrink-0 font-mono text-[11px] text-[var(--ink-muted)]">
          {fmt(progress)} / {fmt(duration)}
        </span>
      </div>

      {caption && (
        <figcaption className="border-t-2 border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function fmt(s: number) {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
