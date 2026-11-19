"use client";

import { useRef } from "react";
import { toggleKioskTheme, toggleWelcomeArtwork } from "../design/kiosk-theme";
import styles from "./Welcome.module.css";

export function OperatorHotspot({ artwork = false }: { artwork?: boolean }) {
  const taps = useRef<number[]>([]);

  function registerTap() {
    const now = performance.now();

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
      onClick={registerTap}
      onKeyDown={event => {
        if (event.repeat && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
        }
      }}
    />
  );
}
