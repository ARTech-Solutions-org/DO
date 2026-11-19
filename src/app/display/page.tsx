"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./Display.module.css";

const CANVAS_W = 384;
const CANVAS_H = 512;
const CARD_SIZE = 220;
const MAX_X = CANVAS_W - CARD_SIZE;
const MAX_Y = CANVAS_H - CARD_SIZE;

export default function SecondaryDisplay() {
  const [status, setStatus] = useState<"idle" | "photo">("idle");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showShockwave, setShowShockwave] = useState(false);
  const [edgeHit, setEdgeHit] = useState(false);

  const posRef = useRef({
    x: (CANVAS_W - CARD_SIZE) / 2,
    y: (CANVAS_H - CARD_SIZE) / 2,
    vx: 1.6,
    vy: 1.4,
  });

  const cardElemRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const edgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger edge impact visual feedback
  const triggerEdgeHit = () => {
    setEdgeHit(true);
    if (edgeTimerRef.current) clearTimeout(edgeTimerRef.current);
    edgeTimerRef.current = setTimeout(() => {
      setEdgeHit(false);
    }, 180);
  };

  // State synchronization with server & BroadcastChannel
  useEffect(() => {
    let active = true;

    const handleUpdate = (data: { status: "idle" | "photo"; photoUrl?: string }) => {
      if (!active) return;
      if (data.status === "photo" && data.photoUrl) {
        setStatus("photo");
        setPhotoUrl(data.photoUrl);
        // Trigger punch animation and shockwave
        setShowShockwave(true);
        setTimeout(() => setShowShockwave(false), 700);

        // Center card initially for the punch
        posRef.current.x = (CANVAS_W - CARD_SIZE) / 2;
        posRef.current.y = (CANVAS_H - CARD_SIZE) / 2;
        // Randomize initial direction slightly
        const dirX = Math.random() > 0.5 ? 1.6 : -1.6;
        const dirY = Math.random() > 0.5 ? 1.4 : -1.4;
        posRef.current.vx = dirX;
        posRef.current.vy = dirY;
      } else if (data.status === "idle") {
        setStatus("idle");
        setPhotoUrl(null);
      }
    };

    // 1. Listen to BroadcastChannel for local cross-tab zero-latency events
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("do_booth_display");
      bc.onmessage = (event) => {
        if (event.data) handleUpdate(event.data);
      };
    }

    // 2. Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/display/stream");
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleUpdate(parsed);
        } catch {}
      };
      eventSource.onerror = () => {
        // SSE error, will reconnect automatically or fallback to polling
      };
    } catch {}

    // 3. Fallback polling every 800ms
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/display", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          handleUpdate(json);
        }
      } catch {}
    }, 800);

    return () => {
      active = false;
      bc?.close();
      eventSource?.close();
      clearInterval(pollInterval);
    };
  }, []);

  // DVD Bounce Animation Loop
  useEffect(() => {
    if (status !== "photo") {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let isPunched = false;
    const startDelayTimer = setTimeout(() => {
      isPunched = true;
    }, 600);

    const updatePhysics = () => {
      if (cardElemRef.current && isPunched) {
        const p = posRef.current;
        p.x += p.vx;
        p.y += p.vy;

        let hit = false;
        if (p.x <= 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
          hit = true;
        } else if (p.x >= MAX_X) {
          p.x = MAX_X;
          p.vx = -Math.abs(p.vx);
          hit = true;
        }

        if (p.y <= 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
          hit = true;
        } else if (p.y >= MAX_Y) {
          p.y = MAX_Y;
          p.vy = -Math.abs(p.vy);
          hit = true;
        }

        if (hit) triggerEdgeHit();

        cardElemRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      } else if (cardElemRef.current && !isPunched) {
        // Center position during punch-in
        const p = posRef.current;
        cardElemRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      clearTimeout(startDelayTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [status]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.canvas}>
        <div className={styles.ambient} />
        <div className={styles.ambientBeam} />

        {/* --- Idle State: Logos & Branding --- */}
        <div className={`${styles.idleContainer} ${status === "photo" ? styles.idleContainerHidden : ""}`}>
          <Image
            src="/artwork/brand/one-development-logo.png"
            alt="ONE Development"
            width={240}
            height={160}
            className={styles.topLogo}
            priority
            unoptimized
          />

          <div className={styles.eventTitle}>
            <div className={styles.centerArtwork}>
              <div className={styles.centerIcon}>✦</div>
            </div>
            <span className={styles.boothBadge}>AI PHOTO BOOTH</span>
          </div>

          <Image
            src="/artwork/brand/do-hotels-white.png"
            alt="DO Hotels"
            width={210}
            height={140}
            className={styles.bottomLogo}
            priority
            unoptimized
          />
        </div>

        {/* --- Punch-In Shockwave Burst --- */}
        {showShockwave && <div className={styles.shockwave} />}

        {/* --- Bouncing Photo Card --- */}
        {status === "photo" && photoUrl && (
          <div ref={cardElemRef} className={styles.bouncingWrapper}>
            <div className={`${styles.bouncingCard} ${styles.punchIn} ${edgeHit ? styles.edgeHit : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Guest Portrait"
                className={styles.photoImg}
              />
              <div className={styles.cardBadge}>DO HOTELS × ONE</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
