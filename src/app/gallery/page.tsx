"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Gallery.module.css";

export interface ArchivedPhoto {
  id: string;
  key: string;
  url: string;
  createdAt: string;
  size: number;
  passNumber: string;
  filename: string;
}

function timeAgo(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 30) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

function formatFullDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<ArchivedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "slideshow">("grid");
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePhoto, setActivePhoto] = useState<ArchivedPhoto | null>(null);
  const [copied, setCopied] = useState(false);
  const [newToast, setNewToast] = useState<string | null>(null);

  const prevIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPhotos = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/gallery", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch gallery");
      const data = await res.json();
      const fetched: ArchivedPhoto[] = data.photos || [];

      // Detect brand new photos for toast alert
      if (prevIdsRef.current.size > 0) {
        const newlyAdded = fetched.filter(p => !prevIdsRef.current.has(p.id));
        if (newlyAdded.length > 0) {
          const pass = newlyAdded[0].passNumber || "Guest";
          setNewToast(`New portrait added: ${pass}`);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setNewToast(null), 4000);
        }
      }

      prevIdsRef.current = new Set(fetched.map(p => p.id));
      setPhotos(fetched);
    } catch (err) {
      console.warn("Gallery sync error:", err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 600);
    }
  }, []);

  // Initial load and recurring 12-second live poll
  useEffect(() => {
    void fetchPhotos();
    const interval = setInterval(() => {
      void fetchPhotos();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchPhotos]);

  // Slideshow auto-advance
  useEffect(() => {
    if (viewMode !== "slideshow" || !isPlaying || photos.length === 0) return;
    const timer = setInterval(() => {
      setSlideshowIndex(current => (current + 1) % photos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [viewMode, isPlaying, photos.length]);

  // Keyboard navigation for Lightbox and Slideshow
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (activePhoto) {
        if (e.key === "Escape") setActivePhoto(null);
        if (e.key === "ArrowRight") navigateLightbox(1);
        if (e.key === "ArrowLeft") navigateLightbox(-1);
      } else if (viewMode === "slideshow") {
        if (e.key === "ArrowRight") setSlideshowIndex(c => (c + 1) % photos.length);
        if (e.key === "ArrowLeft") setSlideshowIndex(c => (c - 1 + photos.length) % photos.length);
        if (e.key === " ") {
          e.preventDefault();
          setIsPlaying(p => !p);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhoto, photos, viewMode]);

  function navigateLightbox(dir: 1 | -1) {
    if (!activePhoto || photos.length <= 1) return;
    const currentIndex = photos.findIndex(p => p.id === activePhoto.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + dir + photos.length) % photos.length;
    setActivePhoto(photos[nextIndex]);
    setCopied(false);
  }

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = (photo: ArchivedPhoto) => {
    const a = document.createElement("a");
    a.href = photo.url;
    a.download = photo.filename || `do-hotels-${photo.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  };

  const currentSlide = photos[slideshowIndex] || null;

  return (
    <div className={styles.galleryContainer} data-mode={viewMode}>
      {/* Background Ambience */}
      <div className={styles.ambientBackdrop} aria-hidden="true" />

      {/* Top Notification Toast */}
      {newToast && (
        <aside className={styles.toast} role="status" aria-live="polite">
          <span className={styles.toastIcon} aria-hidden="true">✦</span>
          <span>{newToast}</span>
        </aside>
      )}

      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.oneBrand}>
            <Image
              src="/artwork/brand/one-development-logo.png"
              alt="ONE Development"
              width={140}
              height={50}
              priority
              unoptimized
              className={styles.oneLogo}
            />
          </div>
          <span className={styles.brandDivider} aria-hidden="true">✕</span>
          <div className={styles.doBrand}>
            <Image
              src="/artwork/brand/do-hotels-white.png"
              alt="DO Hotels"
              width={80}
              height={68}
              priority
              unoptimized
              className={styles.doLogo}
            />
          </div>
        </div>

        {/* Live Event Counter Badge */}
        <div className={styles.liveBadge} title="Real-time synchronized event feed">
          <span className={`${styles.pulseDot} ${refreshing ? styles.dotSpin : ""}`} aria-hidden="true" />
          <span className={styles.liveText}>LIVE ARCHIVE</span>
          <span className={styles.countText}>
            {loading ? "SYNCING…" : `${photos.length} ${photos.length === 1 ? "PORTRAIT" : "PORTRAITS"}`}
          </span>
        </div>

        {/* Control Actions */}
        <div className={styles.controls}>
          {/* Mode Switcher */}
          <div className={styles.modeSwitcher} role="group" aria-label="Gallery view mode">
            <button
              type="button"
              className={styles.modeBtn}
              data-active={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              title="Grid mosaic view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span className={styles.modeLabel}>Gallery</span>
            </button>
            <button
              type="button"
              className={styles.modeBtn}
              data-active={viewMode === "slideshow"}
              onClick={() => {
                setViewMode("slideshow");
                if (photos.length > 0 && slideshowIndex >= photos.length) setSlideshowIndex(0);
              }}
              title="Ambient presentation slideshow"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span className={styles.modeLabel}>Display</span>
            </button>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => void fetchPhotos(true)}
            disabled={refreshing}
            aria-label="Refresh gallery"
            title="Refresh now"
          >
            <svg
              className={refreshing ? styles.spinning : ""}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            title="Toggle fullscreen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {loading && photos.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loaderPulse} />
            <p className={styles.loadingTitle}>CONNECTING TO LIVE ARCHIVE…</p>
            <p className={styles.loadingSubtitle}>Retrieving framed portraits from Cloudflare storage</p>
          </div>
        ) : photos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyAura} aria-hidden="true" />
            <Image
              src="/artwork/brand/do-hotels-white.png"
              alt="DO Hotels"
              width={200}
              height={170}
              priority
              unoptimized
              className={styles.emptyLogo}
            />
            <h2 className={styles.emptyTitle}>NO PORTRAITS CAPTURED YET</h2>
            <p className={styles.emptyDescription}>
              Portraits created at the DO Hotels photo booth will appear here automatically with their custom frames.
            </p>
            <button
              type="button"
              className={styles.emptyRefreshBtn}
              onClick={() => void fetchPhotos(true)}
            >
              Check Again
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* ================= GRID VIEW ================= */
          <div className={styles.gridSection}>
            <div className={styles.gridContainer}>
              {photos.map((item, index) => (
                <article
                  key={item.id}
                  className={styles.photoCard}
                  style={{ animationDelay: `${Math.min(index * 40, 600)}ms` }}
                  onClick={() => setActivePhoto(item)}
                >
                  <div className={styles.imageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`Portrait ${item.passNumber}`}
                      loading="lazy"
                      className={styles.cardImage}
                    />
                    <div className={styles.cardOverlay}>
                      <span className={styles.passBadge}>{item.passNumber}</span>
                      <div className={styles.cardBottomBar}>
                        <span className={styles.cardTime}>{timeAgo(item.createdAt)}</span>
                        <button
                          type="button"
                          className={styles.cardDownloadBtn}
                          aria-label={`Download ${item.passNumber}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                          title="Download Portrait"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          /* ================= SLIDESHOW / AMBIENT DISPLAY VIEW ================= */
          <section className={styles.slideshowSection} aria-label="Live presentation slideshow">
            {currentSlide && (
              <div className={styles.slideshowFrame}>
                <div className={styles.slideshowGlow} aria-hidden="true" />
                <div className={styles.slideHero}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={currentSlide.id}
                    src={currentSlide.url}
                    alt={`Portrait ${currentSlide.passNumber}`}
                    className={styles.slideImage}
                  />
                </div>
                <div className={styles.slideMeta}>
                  <div className={styles.slidePass}>{currentSlide.passNumber}</div>
                  <div className={styles.slideDate}>{formatFullDate(currentSlide.createdAt)}</div>
                  <div className={styles.slideIndicator}>
                    {slideshowIndex + 1} / {photos.length}
                  </div>
                </div>

                {/* Slideshow Player Bar */}
                <div className={styles.slideshowControls}>
                  <button
                    type="button"
                    className={styles.slideNavBtn}
                    onClick={() => setSlideshowIndex(c => (c - 1 + photos.length) % photos.length)}
                    aria-label="Previous slide"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.slidePlayBtn}
                    onClick={() => setIsPlaying(p => !p)}
                    aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    className={styles.slideNavBtn}
                    onClick={() => setSlideshowIndex(c => (c + 1) % photos.length)}
                    aria-label="Next slide"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.slideDownloadBtn}
                    onClick={() => handleDownload(currentSlide)}
                    title="Download current portrait"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ================= LIGHTBOX MODAL ================= */}
      {activePhoto && (
        <div
          className={styles.lightboxBackdrop}
          onClick={() => setActivePhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Portrait Viewer"
        >
          <div className={styles.lightboxCard} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setActivePhoto(null)}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Left/Right Prev/Next Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.lightboxArrow} ${styles.lightboxArrowPrev}`}
                  onClick={() => navigateLightbox(-1)}
                  aria-label="Previous portrait"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.lightboxArrow} ${styles.lightboxArrowNext}`}
                  onClick={() => navigateLightbox(1)}
                  aria-label="Next portrait"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

            <div className={styles.lightboxBody}>
              <div className={styles.lightboxImageContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePhoto.url}
                  alt={`Portrait ${activePhoto.passNumber}`}
                  className={styles.lightboxImage}
                />
              </div>

              <div className={styles.lightboxMeta}>
                <div className={styles.lightboxHeader}>
                  <span className={styles.lightboxTag}>OFFICIAL EVENT PORTRAIT</span>
                  <h3 className={styles.lightboxPass}>{activePhoto.passNumber}</h3>
                  <p className={styles.lightboxTime}>
                    Captured on {formatFullDate(activePhoto.createdAt)} ({timeAgo(activePhoto.createdAt)})
                  </p>
                </div>

                <div className={styles.lightboxActions}>
                  <button
                    type="button"
                    className={styles.lightboxDownloadBtn}
                    onClick={() => handleDownload(activePhoto)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download Original</span>
                  </button>

                  <button
                    type="button"
                    className={styles.lightboxShareBtn}
                    onClick={() => void handleCopyLink(activePhoto.url)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copied ? "Link Copied!" : "Copy Image Link"}</span>
                  </button>
                </div>

                <div className={styles.lightboxBrandFooter}>
                  <Image
                    src="/artwork/brand/one-development-logo.png"
                    alt="ONE Development"
                    width={100}
                    height={36}
                    unoptimized
                    className={styles.lightboxMiniLogo}
                  />
                  <span className={styles.lightboxBrandDot}>•</span>
                  <span className={styles.lightboxBrandText}>DO HOTELS EXPERIENCE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
