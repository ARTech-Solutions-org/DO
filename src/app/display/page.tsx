"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./Display.module.css";

type Update = { status: "idle" | "photo"; photoUrl?: string; jobId?: string; updatedAt?: number; photo?: Blob };
type Photo = { id: string; url: string };

function Portrait({ photo, onError }: { photo: Photo; onError: () => void }) {
  const [ready, setReady] = useState(false);
  return <div className={styles.photoFrame} data-ready={ready}>
      {/* Display events supply the image URL at runtime. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="Guest portrait" className={styles.portrait}
        onLoad={() => setReady(true)} onError={onError} />
  </div>;
}

export default function SecondaryDisplay() {
  const [photo, setPhoto] = useState<Photo | null>(null);

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
        setPhoto(null);
        if (localUrl) URL.revokeObjectURL(localUrl);
        localUrl = undefined;
      }
      if (data.status === "photo" && data.photo instanceof Blob) {
        if (localUrl) URL.revokeObjectURL(localUrl);
        localUrl = URL.createObjectURL(data.photo);
        setPhoto({ id: data.jobId!, url: localUrl });
        return;
      }
      if (data.status === "photo" && data.photoUrl) {
        const next = { id: data.jobId || data.photoUrl, url: data.photoUrl };
        setPhoto(previous => previous?.id === next.id ? previous : next);
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

  return <section className={styles.screen} aria-label="Event display">
    <div className={styles.logos}>
      <Image src="/artwork/brand/do-hotels-white.png" alt="DO Hotels" width={211} height={146} priority unoptimized />
      <Image src="/artwork/brand/one-development-logo.png" alt="ONE Development" width={440} height={309} priority unoptimized />
    </div>
    {photo && <Portrait key={photo.id} photo={photo} onError={() =>
      setPhoto(current => current === photo ? null : current)} />}
  </section>;
}
