"use client";

import React, { useState, type ReactNode } from "react";
import styles from "./SaveButton.module.css";

type SaveButtonProps = {
  href?: string;
  download?: boolean | string;
  onClick?: () => void;
  className?: string;
  label?: string;
  savedLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
};

export function SaveButton({
  href,
  download,
  onClick,
  className = "",
  label = "SAVE PHOTO",
  savedLabel = "SAVED!",
  disabled = false,
  children,
}: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  const displayLabel = typeof children === "string" ? children : label;

  function handleTrigger(e: React.MouseEvent) {
    if (disabled) return;
    setIsSaved(true);
    if (onClick) onClick();
    // Reset after 3.5 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 3500);
  }

  const content = (
    <>
      <div className={styles.outline} aria-hidden="true" />

      {/* Default State: Download Icon & Letters */}
      <div className={`${styles.state} ${styles["state--default"]}`}>
        <div className={styles.icon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1.25em"
            height="1.25em"
            fill="none"
          >
            <g style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
              {/* Sleek downward Save / Download Arrow */}
              <path
                fill="currentColor"
                d="M11 2a1 1 0 0 1 2 0v10.17l3.59-3.58a1 1 0 1 1 1.41 1.41l-5.3 5.3a1 1 0 0 1-1.4 0l-5.3-5.3a1 1 0 1 1 1.4-1.41L11 12.17V2Z"
              />
              {/* Base Tray / Bracket */}
              <path
                fill="currentColor"
                d="M4 14a1 1 0 0 1 1 1v3h14v-3a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z"
              />
            </g>
          </svg>
        </div>
        <p>
          {displayLabel.split("").map((char, i) => (
            <span key={i} style={{ ["--i" as string]: i }}>
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </p>
      </div>

      {/* Saved State: Checkmark & "SAVED!" */}
      <div className={`${styles.state} ${styles["state--sent"]}`}>
        <div className={styles.icon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1.25em"
            height="1.25em"
            fill="none"
          >
            <g style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
              <path
                d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8Z"
                fill="currentColor"
              />
              <path
                d="m10.5 15.5-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4-7 7Z"
                fill="currentColor"
              />
            </g>
          </svg>
        </div>
        <p>
          {savedLabel.split("").map((char, i) => (
            <span key={i} style={{ ["--i" as string]: i }}>
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </p>
      </div>
    </>
  );

  const combinedClass = [styles.button, isSaved ? styles.isSaved : "", className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a
        href={href}
        download={download}
        className={combinedClass}
        onClick={handleTrigger}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={combinedClass}
      onClick={handleTrigger}
    >
      {content}
    </button>
  );
}
