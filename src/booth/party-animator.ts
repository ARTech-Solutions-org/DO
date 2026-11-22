// @ts-nocheck
/**
 * Party Mode (LiDAR Scan) Laser Synthesizer
 * Animates the laser point-cloud drawing and neon synthesis on canvas:
 * 1. radar: Deep void holographic radar / sonar grid and coordinate calibration.
 * 2. sweep: Laser beam sweeps down, igniting the 3D neon laser particles.
 * 3. chroma: Chromatic equalizer waves pulse through depth points with party neon colors.
 * 4. crystallize: Laser strobe flash locks the points into the full-density final portrait.
 */

type Particle = {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  brightness: number;
  baseRadius: number;
  phaseOffset: number;
};

export class PartyAnimator {
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.raf = 0;
    this.running = false;
  }

  stop() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.running = false;
  }

  run({
    resultPromise,
    onStage,
  }: {
    resultPromise: Promise<CanvasImageSource>;
    onStage?: (stage: string) => void;
  }): Promise<void> {
    this.stop();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.onStage = onStage || (() => {});

      const W = (this.W = this.canvas.width || 1024);
      const H = (this.H = this.canvas.height || 1024);
      this.canvas.width = W;
      this.canvas.height = H;

      this.particles = [];
      this.img = null;
      this.imgReady = false;
      this.cx = W / 2;
      this.cy = H / 2;
      this.t0 = performance.now();
      this.phase = "radar";
      this.onStage("radar");
      this.running = true;

      resultPromise.then(
        (img) => {
          this.img = img;
          this.prepareParticles(img);
          this.imgReady = true;
        },
        (err) => {
          this.stop();
          this.reject?.(err);
        }
      );

      const loop = (now: number) => {
        if (!this.running) return;
        try {
          this.tick(now);
        } catch (err) {
          this.stop();
          this.reject?.(err);
          return;
        }
        if (this.running) {
          this.raf = requestAnimationFrame(loop);
        }
      };
      this.raf = requestAnimationFrame(loop);
    });
  }

  prepareParticles(img: CanvasImageSource) {
    const W = this.W;
    const H = this.H;
    const sampleSize = 384;
    const offscreen = document.createElement("canvas");
    offscreen.width = sampleSize;
    offscreen.height = sampleSize;
    const octx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!octx) return;

    // Draw image fitted inside sampleSize
    const sw = (img as any).naturalWidth || (img as any).videoWidth || (img as any).width || W;
    const sh = (img as any).naturalHeight || (img as any).videoHeight || (img as any).height || H;
    const scale = Math.min(sampleSize / sw, sampleSize / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (sampleSize - dw) / 2;
    const dy = (sampleSize - dh) / 2;
    octx.drawImage(img, dx, dy, dw, dh);

    const imgData = octx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imgData.data;

    let sumX = 0;
    let sumY = 0;
    let count = 0;
    const candidateList: Particle[] = [];

    // Step across pixels to sample glowing neon points
    const step = 4;
    for (let y = 0; y < sampleSize; y += step) {
      for (let x = 0; x < sampleSize; x += step) {
        const idx = (y * sampleSize + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) * (a / 255);
        if (brightness > 22 && a > 30) {
          const canvasX = (x / sampleSize) * W;
          const canvasY = (y / sampleSize) * H;
          sumX += canvasX;
          sumY += canvasY;
          count++;

          candidateList.push({
            x: canvasX,
            y: canvasY,
            r,
            g,
            b,
            brightness,
            baseRadius: 1.2 + (brightness / 255) * 2.8,
            phaseOffset: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    if (count > 0) {
      this.cx = sumX / count;
      this.cy = sumY / count;
    }

    // Limit to max ~2400 well-distributed points for peak performance
    if (candidateList.length > 2400) {
      const stride = Math.ceil(candidateList.length / 2400);
      this.particles = candidateList.filter((_, i) => i % stride === 0);
    } else {
      this.particles = candidateList;
    }

    // Sort by Y for the laser sweep
    this.particles.sort((a, b) => a.y - b.y);
  }

  tick(now: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const W = this.W;
    const H = this.H;
    const elapsed = (now - this.t0) / 1000;

    // Clear background to deep void
    ctx.fillStyle = "#05040a";
    ctx.fillRect(0, 0, W, H);

    // Timeline durations
    const RADAR_DUR = 1.6;
    const SWEEP_DUR = 3.6;
    const CHROMA_DUR = 2.4;
    const CRYSTAL_DUR = 1.0;

    const tSweep = RADAR_DUR;
    const tChroma = tSweep + SWEEP_DUR;
    const tCrystal = tChroma + CHROMA_DUR;
    const tEnd = tCrystal + CRYSTAL_DUR;

    if (elapsed < tSweep || !this.imgReady) {
      // ─── 1. RADAR / CALIBRATION PHASE ───
      if (this.phase !== "radar") {
        this.phase = "radar";
        this.onStage("radar");
      }

      this.renderRadarGrid(ctx, elapsed, W, H);
      return;
    }

    if (elapsed >= tSweep && elapsed < tChroma) {
      // ─── 2. LASER SWEEP & POINT IGNITION PHASE ───
      if (this.phase !== "sweep") {
        this.phase = "sweep";
        this.onStage("sweep");
      }

      const pTime = (elapsed - tSweep) / SWEEP_DUR;
      this.renderLaserSweep(ctx, pTime, elapsed, W, H);
      return;
    }

    if (elapsed >= tChroma && elapsed < tCrystal) {
      // ─── 3. CHROMATIC EQUALIZER & PARTY WAVE PHASE ───
      if (this.phase !== "chroma") {
        this.phase = "chroma";
        this.onStage("chroma");
      }

      const pTime = (elapsed - tChroma) / CHROMA_DUR;
      this.renderChromaWave(ctx, pTime, elapsed, W, H);
      return;
    }

    if (elapsed >= tCrystal && elapsed < tEnd) {
      // ─── 4. CRYSTALLIZATION & FINAL FADE ───
      if (this.phase !== "final") {
        this.phase = "final";
        this.onStage("final");
      }

      const pTime = (elapsed - tCrystal) / CRYSTAL_DUR;
      this.renderCrystallize(ctx, pTime, W, H);
      return;
    }

    // ─── 5. FINISHED ───
    if (this.img) {
      ctx.drawImage(this.img, 0, 0, W, H);
    }
    this.stop();
    this.resolve?.();
  }

  renderRadarGrid(ctx: CanvasRenderingContext2D, elapsed: number, W: number, H: number) {
    const cx = this.cx;
    const cy = this.cy;

    // Fine holographic grid lines
    ctx.strokeStyle = "rgba(150, 107, 252, 0.12)";
    ctx.lineWidth = 1;

    for (let x = 64; x < W; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 64; y < H; y += 96) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Concentric scanner rings
    const maxR = Math.min(W, H) * 0.44;
    for (const rFrac of [0.25, 0.5, 0.75, 1.0]) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * rFrac, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(195, 74, 255, ${0.1 + rFrac * 0.08})`;
      ctx.stroke();
    }

    // Rotating radar sweep line
    const angle = elapsed * Math.PI * 2.2;
    const sweepLen = maxR * 1.05;
    const endX = cx + Math.cos(angle) * sweepLen;
    const endY = cy + Math.sin(angle) * sweepLen;

    const grad = ctx.createLinearGradient(cx, cy, endX, endY);
    grad.addColorStop(0, "rgba(0, 255, 230, 0.85)");
    grad.addColorStop(0.7, "rgba(195, 74, 255, 0.6)");
    grad.addColorStop(1, "rgba(150, 107, 252, 0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Radar cone glow
    ctx.fillStyle = "rgba(195, 74, 255, 0.06)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxR, angle - 0.4, angle);
    ctx.closePath();
    ctx.fill();

    // Center crosshair
    ctx.strokeStyle = "#00ffe6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy);
    ctx.lineTo(cx + 16, cy);
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx, cy + 16);
    ctx.stroke();

    // Pulse dot
    ctx.fillStyle = "#ffb044";
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  renderLaserSweep(
    ctx: CanvasRenderingContext2D,
    progress: number,
    elapsed: number,
    W: number,
    H: number
  ) {
    const sweepY = progress * (H * 1.15) - H * 0.08;
    const particles = this.particles;

    // Draw ignited particles
    const beamThickness = 55;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.y <= sweepY) {
        const distFromBeam = sweepY - p.y;
        let scale = 1;
        let alpha = 0.9;

        if (distFromBeam < beamThickness) {
          // Just ignited: energetic neon pulse
          const pulse = 1 - distFromBeam / beamThickness;
          scale = 1 + pulse * 1.8;
          alpha = 1;
        }

        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.baseRadius * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw laser beam line
    if (sweepY >= 0 && sweepY <= H) {
      const beamGrad = ctx.createLinearGradient(0, sweepY, W, sweepY);
      beamGrad.addColorStop(0, "rgba(150, 107, 252, 0)");
      beamGrad.addColorStop(0.2, "rgba(195, 74, 255, 0.9)");
      beamGrad.addColorStop(0.5, "rgba(255, 255, 255, 1)");
      beamGrad.addColorStop(0.8, "rgba(255, 176, 68, 0.9)");
      beamGrad.addColorStop(1, "rgba(228, 141, 61, 0)");

      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, sweepY - 2.5, W, 5);

      // Beam aura
      const auraGrad = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
      auraGrad.addColorStop(0, "rgba(195, 74, 255, 0)");
      auraGrad.addColorStop(0.5, "rgba(195, 74, 255, 0.28)");
      auraGrad.addColorStop(1, "rgba(0, 255, 230, 0)");

      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, sweepY - 30, W, 60);
    }
  }

  renderChromaWave(
    ctx: CanvasRenderingContext2D,
    progress: number,
    elapsed: number,
    W: number,
    H: number
  ) {
    const cx = this.cx;
    const cy = this.cy;
    const particles = this.particles;
    const waveRadius = progress * Math.hypot(W, H) * 0.7;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dist = Math.hypot(p.x - cx, p.y - cy);
      const waveDelta = Math.abs(dist - waveRadius);

      let boost = 1;
      let r = p.r;
      let g = p.g;
      let b = p.b;

      if (waveDelta < 85) {
        // Equalizer party crest: inject electric neon radiance
        const crest = 1 - waveDelta / 85;
        boost = 1 + crest * 1.5;

        // Shift color towards electric magenta or golden amber
        r = Math.min(255, Math.round(r * 1.2 + 40 * crest));
        b = Math.min(255, Math.round(b * 1.1 + 60 * crest));
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.baseRadius * boost, 0, Math.PI * 2);
      ctx.fill();
    }

    // Expanding chromatic ripple
    ctx.strokeStyle = `rgba(255, 176, 68, ${Math.max(0, 0.5 * (1 - progress))})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(195, 74, 255, ${Math.max(0, 0.4 * (1 - progress))})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, waveRadius - 35), 0, Math.PI * 2);
    ctx.stroke();
  }

  renderCrystallize(
    ctx: CanvasRenderingContext2D,
    progress: number,
    W: number,
    H: number
  ) {
    const particles = this.particles;

    // Draw all points
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.baseRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smoothly fade in crisp final portrait
    if (this.img) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, progress));
      ctx.drawImage(this.img, 0, 0, W, H);
      ctx.restore();
    }

    // Party strobe sweep
    if (progress < 0.6) {
      const flashAlpha = Math.sin((progress / 0.6) * Math.PI) * 0.35;
      ctx.fillStyle = `rgba(195, 74, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
