"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./Display.module.css";

type Update = { status: "idle" | "photo"; photoUrl?: string; jobId?: string; updatedAt?: number };
type Photo = { id: string; url: string };

function Portrait({ photo, onError }: { photo: Photo; onError: () => void }) {
  const [ready, setReady] = useState(false);
  return <div className={styles.horizontal} data-ready={ready}>
    <div className={styles.vertical}>
      {/* Display events supply the image URL at runtime. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="Guest portrait" className={styles.portrait}
        onLoad={() => setReady(true)} onError={onError} />
    </div>
  </div>;
}

export default function SecondaryDisplay() {
  const [photo, setPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let lastUpdate = -Infinity;
    let revision = 0;
    let polling = false;
    function receive(data: Update) {
      if (controller.signal.aborted || !data) return;
      if (typeof data.updatedAt === "number") {
        if (data.updatedAt < lastUpdate) return;
        lastUpdate = data.updatedAt;
      }
      revision++;
      if (data.status === "idle") setPhoto(null);
      if (data.status === "photo" && data.photoUrl) {
        const next = { id: data.jobId || data.photoUrl, url: data.photoUrl };
        setPhoto(previous => previous?.id === next.id ? previous : next);
      }
    }

    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("do_booth_display") : null;
    if (channel) channel.onmessage = event => receive(event.data);
    const stream = typeof EventSource === "function" ? new EventSource("/api/display/stream") : null;
    if (stream) stream.onmessage = event => {
      try { receive(JSON.parse(event.data)); } catch { /* Incomplete stream message. */ }
    };
    async function poll() {
      if (polling) return;
      polling = true;
      const startedAt = revision;
      try {
        const response = await fetch("/api/display", { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          const update: Update = await response.json();
          if (revision === startedAt) receive(update);
        }
      } catch { /* The next poll can recover a dropped connection. */ }
      finally { polling = false; }
    }
    void poll();
    const interval = setInterval(poll, 800);
    return () => {
      controller.abort();
      clearInterval(interval);
      channel?.close();
      stream?.close();
    };
  }, []);

  return <section className={styles.screen} aria-label="Event display">
    <div className={styles.logos}>
      <Image src="/artwork/brand/do-hotels-white.png" alt="DO Hotels" width={211} height={146} priority unoptimized />
      <Image src="/artwork/brand/one-development-logo.png" alt="ONE Development" width={440} height={309} priority unoptimized />
    </div>
    {photo && <Portrait key={photo.id} photo={photo} onError={() =>
      setPhoto(current => current === photo ? null : current)} />}
  </section>;
}
