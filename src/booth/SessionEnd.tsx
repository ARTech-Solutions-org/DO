import { useEffect, useRef, useState } from "react";
import { PartyButton } from "../design/PartyButton";
import type { Attempt } from "./capture-resume";
import { messages, requiresNewSession, type FailureReason } from "./failure";
import { BrandHeader } from "./BrandHeader";
import styles from "./SessionEnd.module.css";

function focus(node: HTMLHeadingElement | null) { node?.focus(); }

export function ThankYou({ seconds, restart }: { seconds?: number; restart: () => void }) {
  // Stays on screen until user explicitly presses "DO IT AGAIN"
  return <section className={`booth-stage ${styles.stage} ${styles.finale}`} data-stage="thank-you" aria-labelledby="session-end-title">
    <div className={styles.lights} aria-hidden="true" />
    <BrandHeader />
    <h1 id="session-end-title" ref={focus} tabIndex={-1}>YOU NAILED IT!</h1>
    <footer className={styles.actions}><PartyButton onClick={restart}>DO IT AGAIN</PartyButton></footer>
  </section>;
}

export function ErrorAndRetry({ reason, attempt, retry, restart }: {
  reason: FailureReason; attempt: Attempt | null; retry: () => void; restart: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    function abort() { request.current?.abort(); }
    window.addEventListener("pagehide", abort);
    return () => { window.removeEventListener("pagehide", abort); abort(); };
  }, []);

  async function tryAgain() {
    if (request.current) return;
    if (requiresNewSession(reason)) {
      restart();
      return;
    }
    if (reason === "export" && attempt) {
      const controller = new AbortController();
      request.current = controller;
      setBusy(true);
      try {
        const response = await fetch(`/api/booth/${attempt.jobId}/recover`, {
          method: "POST",
          headers: { Authorization: `Bearer ${attempt.owner}` },
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
        });
        if (!response.ok || (await response.json()).status !== "SUCCEEDED") throw new Error("Recovery unavailable");
      } catch {
        if (!controller.signal.aborted) setRetryFailed(true);
        return;
      } finally {
        request.current = null;
        if (!controller.signal.aborted) setBusy(false);
      }
      if (controller.signal.aborted) return;
    }
    retry();
  }

  return <section className={`booth-stage ${styles.stage} ${styles.error}`} data-stage="error" aria-labelledby="session-end-title">
    <BrandHeader />
    <div className={styles.errorCopy}>
      <h1 id="session-end-title" ref={focus} tabIndex={-1}>OOPS!</h1>
      <p role="alert">{retryFailed ? "Check the booth connection, then try saving your photo again." : messages[reason]}</p>
    </div>
    <footer className={styles.actions}>
      <PartyButton variant="glass" icon="refresh" loading={busy} onClick={tryAgain}>TRY AGAIN</PartyButton>
      <button type="button" className={styles.secondary} onClick={restart}>START OVER</button>
    </footer>
  </section>;
}
