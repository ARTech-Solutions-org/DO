"use client";

import { useRef } from "react";
import { toggleKioskTheme, toggleWelcomeArtwork } from "../design/kiosk-theme";
import styles from "./Welcome.module.css";

export function OperatorHotspot({ artwork = false }: { artwork?: boolean }) {
  const taps = useRef<number[]>([]);
  const lastTapTime = useRef<number>(0);

  function registerTap(e?: React.SyntheticEvent | Event) {
    if (e && "stopPropagation" in e) {
      e.stopPropagation();
    }
    const now = Date.now();
    // Allow rapid human taps (>60ms apart), discard duplicate pointerdown+click in same gesture
    if (now - lastTapTime.current < 60) return;
    lastTapTime.current = now;

    try {
      navigator.vibrate?.(35);
    } catch {}

    taps.current = [...taps.current.filter(time => now - time <= 3500), now];
    const threshold = artwork ? 3 : 5;
    if (taps.current.length >= threshold) {
      taps.current = [];
      try {
        navigator.vibrate?.([60, 40, 60]);
      } catch {}
      if (artwork) toggleWelcomeArtwork();
      else toggleKioskTheme();
    }
  }

  return (
    <button
      type="button"
      id={artwork ? "operator-artwork-hotspot" : "operator-theme-hotspot"}
      aria-label={artwork ? "Switch Welcome artwork" : "Operator theme control"}
      className={artwork ? styles.artworkHotspot : styles.hotspot}
      onPointerDown={registerTap}
      onClick={registerTap}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          registerTap();
        }
      }}
    />
  );
}
