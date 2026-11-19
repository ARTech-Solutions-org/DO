"use client";

import Image from "next/image";
import { PartyButton } from "../design/PartyButton";
import { flushSync } from "react-dom";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Camera } from "./Camera";
import { Delivery } from "./Delivery";
import { attemptPointer, bufferCapture, clearAttempt, forgetCapture, newOwner, type Attempt } from "./capture-resume";
import { boothConfig } from "./config";
import { ChooseStyle } from "./ChooseStyle";
import { transition, welcome, type BoothEvent } from "./flow";
import { ErrorAndRetry, ThankYou } from "./SessionEnd";
import { BrandHeader } from "./BrandHeader";
import { OperatorHotspot } from "./ThemeHotspot";
import styles from "./Welcome.module.css";

function safeUUID(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const partners = <BrandHeader />;

export function Welcome({ thankYouSeconds = boothConfig.thankYouSeconds }: { thankYouSeconds?: number }) {
  const [state, send] = useReducer(transition, welcome);
  const capturing = useRef(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const returningToWelcome = useRef(false);

  const finish = useCallback(() => {
    clearAttempt();
    setAttempt(null);
    capturing.current = false;
  }, []);

  const dispatch = useCallback((event: BoothEvent) => {
    if (event.type === "done" || event.type === "reset") finish();
    send(event);
  }, [finish]);

  const reset = useCallback(() => {
    returningToWelcome.current = true;
    dispatch({ type: "reset" });
    // Reset secondary display back to logos
    fetch("/api/display", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "idle" }),
    }).catch(() => {});
    try {
      const bc = new BroadcastChannel("do_booth_display");
      bc.postMessage({ status: "idle" });
      bc.close();
    } catch {}
  }, [dispatch]);

  useEffect(() => {
    queueMicrotask(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (navigation?.type !== "reload") {
        clearAttempt();
        return;
      }
      const saved = attemptPointer();
      if (saved) {
        setAttempt(saved);
        send({ type: "resume-generation", ...saved });
      }
    });
  }, []);

  const starting = useRef(false);
  const handleStart = useCallback(() => {
    if (starting.current) return;
    starting.current = true;
    setTimeout(() => { starting.current = false; }, 600);
    try { navigator.vibrate?.(45); } catch {}
    clearAttempt();
    const sessionId = safeUUID();
    const consentAt = new Date().toISOString();
    dispatch({ type: "consent", sessionId, consentAt });
  }, [dispatch]);

  function returnToWelcome() {
    returningToWelcome.current = true;
    dispatch({ type: "back" });
  }

  function focusStartOnReturn(button: HTMLButtonElement | null) {
    if (button && returningToWelcome.current) {
      returningToWelcome.current = false;
      button.focus();
    }
  }

  if (state.stage === "choose-style") {
    return <ChooseStyle state={state} dispatch={dispatch} partners={partners} onBack={returnToWelcome} />;
  }

  if (state.stage === "camera" || state.stage === "countdown") {
    return <Camera stage={state.stage} dispatch={dispatch} onCapture={async (photo, signal) => {
      if (capturing.current) return;
      capturing.current = true;
      const next = { jobId: safeUUID(), owner: newOwner(), sessionId: state.sessionId,
        consentAt: state.consentAt, styleId: state.styleId };
      try {
        await bufferCapture(next, photo);
        if (signal.aborted) { clearAttempt(next.jobId); capturing.current = false; return; }
        setAttempt(next);
        dispatch({ type: "captured", jobId: next.jobId });
      } catch {
        void forgetCapture(next.jobId);
        capturing.current = false;
        if (signal.aborted) return;
        dispatch({ type: "fail", reason: "local-storage" });
      }
    }} />;
  }

  if (state.stage === "error") {
    return <ErrorAndRetry reason={state.reason ?? "offline"} attempt={attempt}
      retry={() => dispatch({ type: "retry" })} restart={reset} />;
  }

  if (attempt && (state.stage === "processing" || state.stage === "result" || state.stage === "qr")) {
    return <Delivery state={state} attempt={attempt} dispatch={dispatch} reset={reset} />;
  }

  if (state.stage === "thank-you") return <ThankYou seconds={thankYouSeconds} restart={reset} />;

  return (
    <section className={`booth-stage ${styles.poster}`} data-stage="welcome" aria-labelledby="welcome-title">
      <div className={styles.photograph} aria-hidden="true" />
      <div className={styles.beam} aria-hidden="true" />

      <div className={styles.disc} aria-hidden="true"><span className={styles.discLight} /></div>

      <header className={styles.brandHeader}>
        <Image src="/artwork/brand/one-development-logo.png" alt="ONE Development"
          width={440} height={309} unoptimized loading="eager" />
      </header>

      <div className={styles.bill}>
        <p className={styles.medium}>AI PHOTO BOOTH</p>
        <h1 className={styles.title} id="welcome-title">
          <Image src="/artwork/brand/do-hotels-white.png" alt="DO Hotels"
            width={211} height={146} unoptimized loading="eager" />
        </h1>
      </div>

      <footer className={styles.foot}>
        <PartyButton
          className={styles.start}
          onClick={handleStart}
          ref={focusStartOnReturn}
        >
          TAP TO START
        </PartyButton>
      </footer>
      <OperatorHotspot artwork />
      <OperatorHotspot />
    </section>
  );
}
