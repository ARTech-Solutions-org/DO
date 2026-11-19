import { PartyButton } from "../design/PartyButton";
import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import { browserCamera, type CameraAdapter, type CameraSession } from "../camera/browser";
import { boothConfig } from "./config";
import type { BoothEvent } from "./flow";
import { cameraFailure, type FailureReason } from "./failure";
import { BrandHeader } from "./BrandHeader";
import styles from "./Camera.module.css";

type Props = {
  stage: "camera" | "countdown";
  dispatch: Dispatch<BoothEvent>;
  onCapture: (photo: Blob, signal: AbortSignal) => void | Promise<void>;
  adapter?: CameraAdapter;
};

export function Camera({ stage, dispatch, onCapture, adapter = browserCamera }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const session = useRef<CameraSession | null>(null);
  const shutter = useRef<AbortController | null>(null);
  const [beat, setBeat] = useState<number>(boothConfig.countdownSeconds);
  const [device, setDevice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [activeDevice, setActiveDevice] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Waiting for camera permission…");
  const [mirrorView, setMirrorView] = useState(true);
  const [mirrorPhoto, setMirrorPhoto] = useState(false);
  const counting = stage === "countdown";

  const cancel = useCallback(() => {
    if (!shutter.current) return;
    shutter.current.abort();
    shutter.current = null;
    dispatch({ type: "cancel" });
  }, [dispatch]);

  useEffect(() => {
    const scope = new AbortController();
    const preview = video.current!;
    const media = navigator.mediaDevices;
    let current: CameraSession | undefined;
    let scan = 0;
    let mounted = true;
    function fail(reason: FailureReason) {
      if (scope.signal.aborted) return;
      shutter.current?.abort();
      shutter.current = null;
      scope.abort();
      current?.close();
      session.current = null;
      dispatch({ type: "fail", reason });
    }
    function disconnected() { fail("camera-disconnected"); }
    async function listDevices() {
      const sequence = ++scan;
      try {
        const inputs = (await media.enumerateDevices()).filter(item => item.kind === "videoinput");
        if (!mounted || sequence !== scan) return;
        setDevices(inputs.filter(input => input.deviceId));
        if (!scope.signal.aborted && current?.deviceId && !inputs.some(input => input.deviceId === current?.deviceId)) disconnected();
      } catch { /* A browser may permit capture while withholding the device list. */ }
    }
    async function open() {
      await Promise.resolve();
      if (scope.signal.aborted) return;
      try {
        current = await adapter.open(preview, device || undefined, scope.signal, disconnected,
          () => setMessage("Warming up camera…"));
        if (scope.signal.aborted) { current.close(); return; }
        session.current = current;
        setActiveDevice(current.deviceId || device);
        setReady(true);
        setMessage("");
        void listDevices();
      } catch (error) { fail(cameraFailure(error)); }
    }
    function visibility() { if (document.hidden) cancel(); }
    function pageHide() {
      shutter.current?.abort();
      scope.abort();
      current?.close();
    }
    window.addEventListener("blur", cancel);
    window.addEventListener("pagehide", pageHide);
    document.addEventListener("visibilitychange", visibility);
    media?.addEventListener?.("devicechange", listDevices);
    void open();
    return () => {
      mounted = false;
      scope.abort();
      current?.close();
      session.current = null;
      shutter.current?.abort();
      shutter.current = null;
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pagehide", pageHide);
      document.removeEventListener("visibilitychange", visibility);
      media?.removeEventListener?.("devicechange", listDevices);
    };
  }, [adapter, device, attempt, cancel, dispatch]);

  function reopen(id: string) {
    setReady(false);
    setMessage("Waiting for camera permission…");
    setActiveDevice(id);
    setDevice(id);
    setAttempt(value => value + 1);
  }

  function arm() {
    const camera = session.current;
    if (!ready || !camera || shutter.current || document.hidden) return;
    const shot = new AbortController();
    shutter.current = shot;
    let seconds: number = boothConfig.countdownSeconds;
    setBeat(seconds);
    dispatch({ type: "arm" });
    const timer = window.setInterval(async () => {
      if (shot.signal.aborted) return;
      if (document.hidden || !document.hasFocus()) { cancel(); return; }
      seconds -= 1;
      if (seconds > 0) { setBeat(seconds); return; }
      window.clearInterval(timer);
      setBeat(0);
      try {
        const photo = await camera.capture(mirrorPhoto);
        if (!shot.signal.aborted) await onCapture(photo, shot.signal);
      } catch {
        if (shot.signal.aborted) return;
        shot.abort();
        shutter.current = null;
        camera.close();
        session.current = null;
        dispatch({ type: "fail", reason: "capture" });
      }
    }, 1000);
    shot.signal.addEventListener("abort", () => window.clearInterval(timer), { once: true });
  }

  return (
    <section className={`booth-stage ${styles.stage}`} data-stage={stage} aria-label={counting ? "Countdown" : "Camera"}>
      <BrandHeader />
      {!counting && <h1 className={styles.title} tabIndex={-1} ref={focusHeading}>STRIKE A POSE</h1>}
      <div className={styles.frame}>
        <video ref={video} className={mirrorView ? styles.mirror : undefined} aria-label="Live camera preview" muted playsInline />
        {!counting && <span className={styles.guides} aria-hidden="true" />}
      </div>
      {!counting ? <>
        <div className={styles.status} role="status">{message}</div>
        <footer className={styles.actions}>
          <PartyButton disabled={!ready} onClick={arm}>CAPTURE</PartyButton>
          <div className={styles.secondary}>
            <button onClick={() => dispatch({ type: "back" })}>← Back</button>
            <details className={styles.settings}>
              <summary>Camera settings</summary>
              <div className={styles.panel}>
                {devices.length > 1 && <label>Camera
                  <select value={activeDevice} onChange={e => reopen(e.target.value)}>
                    <option value="">Default camera</option>
                    {devices.map((item, i) => <option key={item.deviceId} value={item.deviceId}>{item.label || `Camera ${i + 1}`}</option>)}
                  </select>
                </label>}
                <label><input type="checkbox" checked={mirrorView} onChange={e => setMirrorView(e.target.checked)} /> Mirror preview</label>
                <label><input type="checkbox" checked={mirrorPhoto} onChange={e => setMirrorPhoto(e.target.checked)} /> Mirror saved photo</label>
                <small>4:5 portrait · Center crop</small>
              </div>
            </details>
          </div>
        </footer>
      </> : <div className={styles.countdown}>
        <h1 className={styles.ring} aria-live="assertive" aria-atomic="true" tabIndex={-1} ref={focusHeading}>
          <span key={beat}>{beat || "…"}</span>
        </h1>
        <PartyButton className={styles.cancel} variant="outline" disabled={beat === 0} onClick={cancel}>CANCEL</PartyButton>
      </div>}
    </section>
  );
}

function focusHeading(node: HTMLHeadingElement | null) { node?.focus(); }
