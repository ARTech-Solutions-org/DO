export interface CameraSession {
  deviceId?: string;
  capture(mirror?: boolean): Promise<Blob>;
  close(): void;
}

export interface CameraAdapter {
  open(preview: HTMLVideoElement, deviceId?: string, signal?: AbortSignal,
    onDisconnect?: () => void, onWarmup?: () => void): Promise<CameraSession>;
}

export function portraitCrop(width: number, height: number) {
  const unit = Math.floor(Math.min(width / 4, height / 5));
  if (unit < 1) throw new Error("Camera frame is unavailable.");
  const w = unit * 4;
  const h = unit * 5;
  return { x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2), w, h };
}

export const browserCamera: CameraAdapter = {
  async open(preview, deviceId, signal, onDisconnect, onWarmup) {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (globalThis.isSecureContext === false) {
        throw new Error("Open the booth on HTTPS or localhost to use a camera.");
      }
      throw new Error("Camera API is unavailable on this browser.");
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "user" } }),
          width: { ideal: 1920 }, height: { ideal: 1080 },
        },
      });
    } catch {
      // Fallback for tablets with basic sensors or strict constraints
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
    }
    const [track] = stream.getTracks();
    let closed = false;
    function disconnect() {
      close();
      onDisconnect?.();
    }
    function close() {
      if (closed) return;
      closed = true;
      signal?.removeEventListener("abort", close);
      track?.removeEventListener?.("ended", disconnect);
      for (const item of stream.getTracks()) item.stop();
      if (preview.srcObject === stream) preview.srcObject = null;
    }
    try {
      signal?.throwIfAborted();
      signal?.addEventListener("abort", close, { once: true });
      track?.addEventListener?.("ended", disconnect, { once: true });
      onWarmup?.();
      preview.muted = true;
      preview.playsInline = true;
      preview.srcObject = stream;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          preview.play(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error("Camera warm-up timed out. Try again.")), 12000);
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
      if (closed || !stream.active || preview.readyState < 2 || !preview.videoWidth) {
        throw new Error("Camera could not provide a live frame.");
      }
    } catch (error) {
      close();
      throw error;
    }
    return {
      deviceId: track.getSettings().deviceId, close,
      async capture(mirror = false) {
        if (closed || track.muted || !stream.active || preview.srcObject !== stream || preview.readyState < 2) {
          throw new Error("Camera frame is unavailable.");
        }
        const { x, y, w, h } = portraitCrop(preview.videoWidth, preview.videoHeight);
        const frame = document.createElement("canvas");
        frame.width = w;
        frame.height = h;
        const context = frame.getContext("2d");
        if (!context) throw new Error("Camera frame could not be read.");
        if (mirror) {
          context.translate(w, 0);
          context.scale(-1, 1);
        }
        context.drawImage(preview, x, y, w, h, 0, 0, w, h);
        return new Promise<Blob>((resolve, reject) => frame.toBlob(
          blob => blob ? resolve(blob) : reject(new Error("Frame encoding failed.")), "image/jpeg", 0.96,
        ));
      },
    };
  },
};
