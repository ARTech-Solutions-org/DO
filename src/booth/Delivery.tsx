import Image from "next/image";
import { PartyButton, PartyLink } from "../design/PartyButton";
import { useEffect, useRef, useState, type Dispatch } from "react";
import { forgetCapture, readCapture, type Attempt } from "./capture-resume";
import type { BoothEvent, BoothState } from "./flow";
import type { FailureReason } from "./failure";
import { BrandHeader } from "./BrandHeader";
import { TicketCard } from "./TicketCard";
import { SaveButton } from "../design/SaveButton";
import { displayResult } from "./display-session";
import { Animator } from "./sketch";
import styles from "./Delivery.module.css";

type Stage = "processing" | "result" | "qr";
type JobStatus = {
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMED_OUT";
  mock: boolean;
  canRecover: boolean;
  rateLimited: boolean;
  failureStage: "generation" | "export" | null;
};
type Link = { url: string; qr: string | null; idleSeconds: number; expiresAt?: number };

function focus(node: HTMLHeadingElement | null) { node?.focus(); }

export function Delivery({ state, attempt, dispatch, reset }: {
  state: Extract<BoothState, { stage: Stage }>;
  attempt: Attempt;
  dispatch: Dispatch<BoothEvent>;
  reset: () => void;
}) {
  const [photo, setPhoto] = useState<string>();
  const [link, setLink] = useState<Link>();
  const [mock, setMock] = useState(false);
  const [drawingStage, setDrawingStage] = useState<string>("wait");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatorRef = useRef<Animator | null>(null);
  const { stage } = state;
  const { jobId, owner, sessionId, consentAt, styleId } = attempt;
  const endpoint = "/api/booth/" + jobId;

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const headers = { Authorization: "Bearer " + owner };
    let objectUrl: string | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fail = (reason: FailureReason) => {
      if (!signal.aborted) dispatch({ type: "fail", reason });
    };
    const request = (resource: string, options: RequestInit = {}, milliseconds = 15_000) =>
      fetch(endpoint + resource, { ...options, headers: { ...headers, ...options.headers },
        signal: AbortSignal.any([signal, AbortSignal.timeout(milliseconds)]) });
    async function poll() {
      let misses = 0;
      while (!signal.aborted) {
        try {
          let response = await request("");
          if (response.status === 404) {
            const capture = await readCapture(jobId);
            if (!capture) { fail("capture-missing"); return; }
            response = await request("", { method: "POST", body: capture, headers: {
              "Content-Type": "image/jpeg", "X-Booth-Session": sessionId,
              "X-Booth-Consent": consentAt, "X-Booth-Style": styleId,
            } }, 45_000);
          }
          if (response.status === 400 || response.status === 409) {
            fail("capture-missing");
            return;
          }
          if (!response.ok) throw new Error("Job unavailable.");
          const current = await response.json() as JobStatus;
          if (signal.aborted) return;
          setMock(current.mock);
          if (current.status === "SUCCEEDED") {
            void forgetCapture(jobId);
            if (styleId === "caricature") {
              try {
                let canvas = canvasRef.current;
                if (!canvas) {
                  for (let r = 0; r < 10 && !canvas; r++) {
                    await new Promise(res => setTimeout(res, 100));
                    canvas = canvasRef.current;
                  }
                }
                if (canvas) {
                  const photoRes = await request("/portrait", {}, 20_000);
                  if (photoRes.ok) {
                    const blob = await photoRes.blob();
                    if (signal.aborted) return;
                    displayResult(jobId, blob);
                    const url = URL.createObjectURL(blob);
                    objectUrl = url;
                    setPhoto(url);

                    const img = new window.Image();
                    img.src = url;
                    await new Promise((resolve) => {
                      img.onload = resolve;
                      img.onerror = resolve;
                    });

                    if (!signal.aborted && canvas) {
                      const animator = new Animator(canvas);
                      animatorRef.current = animator;
                      await animator.run({
                        resultPromise: Promise.resolve(img),
                        onStage: (st: string) => {
                          if (!signal.aborted) setDrawingStage(st);
                        },
                      });
                    }
                  }
                }
              } catch (animErr) {
                console.error("Sketch animation error:", animErr);
              }
            }
            dispatch({ type: "generated", jobId, resultId: jobId });
            return;
          }
          if (current.status === "FAILED" || current.status === "TIMED_OUT") {
            void forgetCapture(jobId);
            fail(current.rateLimited ? "rate-limit" : current.canRecover ? "export" :
              current.status === "TIMED_OUT" ? "generation-timeout" : "generation");
            return;
          }
          misses = 0;
        } catch (err) {
          console.warn("Booth polling retry:", err);
          if (++misses >= 30) {
            fail("offline");
            return;
          }
        }
        await new Promise<void>(resolve => {
          const wake = () => { signal.removeEventListener("abort", wake); clearTimeout(timer); resolve(); };
          timer = setTimeout(wake, 800);
          signal.addEventListener("abort", wake, { once: true });
          if (signal.aborted) wake();
        });
      }
    }
    async function getLink() {
      let attempts = 0;
      while (!signal.aborted) {
        try {
          const response = await request("/link", { method: "POST" }, 15_000);
          if (response.status === 404 || response.status === 410) { fail("link-expired"); return; }
          if (!response.ok) throw new Error("Link fetch failed");
          const value = await response.json() as Link;
          if (signal.aborted) return;
          if (!value.url || !Number.isFinite(value.idleSeconds)) { fail("link"); return; }
          const lifetime = value.expiresAt === undefined ? Infinity : value.expiresAt - Date.now();
          if (lifetime <= 0) { fail("link-expired"); return; }
          setLink(value);
          return;
        } catch {
          if (++attempts >= 3) {
            fail("link");
            return;
          }
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }
    async function getPhoto() {
      let attempts = 0;
      while (!signal.aborted) {
        try {
          const response = await request("/portrait", {}, 20_000);
          if (!response.ok) throw new Error("Photo unavailable.");
          const blob = await response.blob();
          if (signal.aborted) return;
          objectUrl = URL.createObjectURL(blob);
          setPhoto(objectUrl);
          displayResult(jobId, blob);
          return;
        } catch {
          if (++attempts >= 3) {
            fail("result");
            return;
          }
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }
    if (stage === "processing") void poll();
    if (stage === "result") void getPhoto();
    if (stage === "qr") void getLink();
    function release() {
      if (animatorRef.current) animatorRef.current.stop();
      controller.abort();
      clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
    window.addEventListener("pagehide", release);
    return () => { window.removeEventListener("pagehide", release); release(); };
  }, [stage, endpoint, jobId, owner, sessionId, consentAt, styleId, dispatch]);

  return (
    <section className={`booth-stage ${styles.stage}`} data-stage={stage}>
      <BrandHeader />
      {stage === "processing" && (
        <>
          {styleId === "caricature" ? (
            <div className={styles.sketchWrapper}>
              <canvas
                ref={canvasRef}
                width={1024}
                height={1024}
                className={styles.sketchCanvas}
              />
              {(drawingStage === "wait" || drawingStage === "sketch") && (
                <div className={styles.processing} style={{ position: "absolute", inset: 0 }}>
                  <div className={styles.vinyl} aria-hidden="true"><i /></div>
                  <h1 ref={focus} tabIndex={-1}>MAKING<br /> MAGIC</h1>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.processing}>
              <div className={styles.vinyl} aria-hidden="true"><i /></div>
              <h1 ref={focus} tabIndex={-1}>MAKING<br /> MAGIC</h1>
            </div>
          )}
          <p className={styles.sub} role="status">
            {styleId === "caricature"
              ? drawingStage === "wait" || drawingStage === "sketch"
                ? "CREATING YOUR CARICATURE…"
                : drawingStage === "redraw"
                ? "INKING DETAILS & OUTLINES…"
                : drawingStage === "color"
                ? "COLORING IN YOUR LOOK…"
                : "FINISHING TOUCHES…"
              : "ACQUIRING 3D POINT CLOUD…"}
          </p>
        </>
      )}
      {stage === "result" && <>
        <h1 ref={focus} tabIndex={-1}>YOUR LOOK</h1>
        <div className={styles.portrait}>
          {photo && <Image src={photo} unoptimized width={1024} height={1024} alt={styleId === "lidar" ? "Your LiDAR portrait" : "Your caricature portrait"} />}
          {mock && <span>DEVELOPMENT SAMPLE</span>}
        </div>
        <footer className={styles.actions}>
          <SaveButton
            label="GET MY PHOTO"
            savedLabel="OPENING PASS…"
            disabled={!photo}
            onClick={() => {
              setTimeout(() => {
                setPhoto(undefined);
                setLink(undefined);
                dispatch({ type: "open-qr" });
              }, 450);
            }}
          />
          <button className={styles.secondary} onClick={reset}>START OVER</button>
        </footer>
      </>}
      {stage === "qr" && <>
        <h1 ref={focus} tabIndex={-1}>SCAN &amp; SAVE</h1>
        {link?.qr ? (
          <TicketCard
            qr={link.qr}
            passNumber={`#DO-${jobId.slice(0, 4).toUpperCase()}`}
            dateText="ONE × DO HOTELS"
            subtitle="Scan to save your photo"
          />
        ) : link ? (
          <div className={styles.qr}>
            <div className={styles.local}>
              <p>NONPUBLIC DEVELOPMENT PREVIEW</p>
              <PartyLink variant="orange" icon="scan" size="compact" href={link.url} target="_blank" rel="noreferrer">
                Open local download preview
              </PartyLink>
            </div>
          </div>
        ) : (
          <div className={styles.qr}>
            <p role="status">Preparing link…</p>
          </div>
        )}
        <footer className={styles.actions}>
          <PartyButton variant="outline" onClick={() => dispatch({ type: "done" })}>DONE</PartyButton>
        </footer>
      </>}
    </section>
  );
}
