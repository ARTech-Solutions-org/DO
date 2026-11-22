"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Animator } from "../../booth/sketch";
import styles from "./Display.module.css";

type Update = {
  status: "idle" | "photo" | "processing";
  photoUrl?: string;
  jobId?: string;
  updatedAt?: number;
  photo?: Blob;
  styleId?: string;
};

type Photo = { id: string; url: string; styleId?: string };

function Portrait({ photo, onError }: { photo: Photo; onError: () => void }) {
  const [ready, setReady] = useState(false);
  const [animating, setAnimating] = useState(photo.styleId !== "lidar");
  const [stage, setStage] = useState<string>("sketch");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatorRef = useRef<Animator | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runAnimation() {
      try {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = photo.url;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            onError();
            reject(new Error("Image failed to load"));
          };
        });

        if (cancelled) return;
        setReady(true);

        // If LiDAR or canvas is unavailable, display final directly
        if (photo.styleId === "lidar" || !canvasRef.current) {
          setAnimating(false);
          return;
        }

        const animator = new Animator(canvasRef.current);
        animatorRef.current = animator;

        await animator.run({
          resultPromise: Promise.resolve(img),
          onStage: (st: string) => {
            if (!cancelled) setStage(st);
          },
        });

        if (!cancelled) {
          setAnimating(false);
        }
      } catch (err) {
        console.warn("Display sketch error:", err);
        if (!cancelled) {
          setReady(true);
          setAnimating(false);
        }
      }
    }

    void runAnimation();

    return () => {
      cancelled = true;
      if (animatorRef.current) {
        animatorRef.current.stop();
        animatorRef.current = null;
      }
    };
  }, [photo.url, photo.styleId, onError]);

  const stageLabel = animating
    ? stage === "redraw"
      ? "INKING DETAILS & OUTLINES…"
      : stage === "color"
      ? "COLORING IN YOUR LOOK…"
      : "CREATING YOUR CARICATURE…"
    : "ONE × DO HOTELS";

  return (
    <div className={styles.photoFrame} data-ready={ready}>
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={1024}
          height={1024}
          className={styles.sketchCanvas}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt="Guest portrait"
          className={styles.portrait}
          data-visible={!animating}
          onError={onError}
        />
      </div>
      <div className={styles.stageBadge} data-live={animating}>
        <span className={styles.pulseDot} />
        <span className={styles.stageText}>{stageLabel}</span>
      </div>
    </div>
  );
}

export default function SecondaryDisplay() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let lastUpdate = -Infinity;
    let revision = 0;
    let pending: AbortController | undefined;
    let localUrl: string | undefined;

    function receive(data: Update) {
      if (controller.signal.aborted || !data) return;
      if (typeof data.updatedAt === "number") {
        if (data.updatedAt < lastUpdate) return;
        lastUpdate = data.updatedAt;
      }
      revision++;

      if (data.status === "idle") {
        setProcessing(false);
        setPhoto(null);
        if (localUrl) URL.revokeObjectURL(localUrl);
        localUrl = undefined;
        return;
      }

      if (data.status === "processing") {
        setProcessing(true);
        return;
      }

      if (data.status === "photo") {
        setProcessing(false);
        if (data.photo instanceof Blob) {
          if (localUrl) URL.revokeObjectURL(localUrl);
          localUrl = URL.createObjectURL(data.photo);
          setPhoto({ id: data.jobId!, url: localUrl, styleId: data.styleId });
          return;
        }
        if (data.photoUrl) {
          const next: Photo = { id: data.jobId || data.photoUrl, url: data.photoUrl, styleId: data.styleId };
          setPhoto(previous => previous?.id === next.id && previous.url === next.url ? previous : next);
        }
      }
    }

    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("do_booth_display") : null;
    if (channel) channel.onmessage = event => receive(event.data);

    async function poll() {
      if (pending) return;
      const request = new AbortController();
      pending = request;
      const timeout = setTimeout(() => request.abort(), 15_000);
      const startedAt = revision;
      try {
        const response = await fetch("/api/display", { cache: "no-store", signal: request.signal });
        if (response.ok) {
          const update: Update = await response.json();
          if (revision === startedAt) receive(update);
        }
      } catch { /* The next poll can recover a dropped connection. */ }
      finally { clearTimeout(timeout); pending = undefined; }
    }

    void poll();
    const interval = setInterval(poll, 800);

    return () => {
      controller.abort();
      pending?.abort();
      clearInterval(interval);
      channel?.close();
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, []);

  return (
    <section className={styles.screen} data-has-content={Boolean(photo || processing)} aria-label="Event display">
      <div className={styles.logos}>
        <Image src="/artwork/brand/one-development-logo.png" alt="ONE Development" width={440} height={309} priority unoptimized />
        <Image src="/artwork/brand/do-hotels-white.png" alt="DO Hotels" width={211} height={180} priority unoptimized />
      </div>

      {processing && !photo && (
        <div className={styles.processingBanner}>
          <div className={styles.magicSpinner} aria-hidden="true" />
          <p className={styles.magicText}>MAKING MAGIC…</p>
        </div>
      )}

      {photo && (
        <Portrait
          key={photo.id}
          photo={photo}
          onError={() => setPhoto(current => current === photo ? null : current)}
        />
      )}
    </section>
  );
}
