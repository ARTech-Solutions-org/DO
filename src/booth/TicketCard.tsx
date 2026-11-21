"use client";

import Image from "next/image";
import styles from "./TicketCard.module.css";

type TicketCardProps = {
  qr?: string | null;
  passNumber?: string;
  dateText?: string;
  title?: string;
  subtitle?: string;
};

export function TicketCard({
  qr,
  passNumber = "#DO-VIP",
  dateText = "ONE × DO HOTELS",
  title,
  subtitle = "Scan to save your photo",
}: TicketCardProps) {
  return (
    <div className={styles.ticketWrapper}>
      <div className={styles.card}>
        <div className={styles.notes} aria-hidden="true">♪♪♪♪♪</div>
        <div className={styles.notes} aria-hidden="true">♪♪♪♪</div>
        <div className={styles.notes} aria-hidden="true">♪♪♪♪♪</div>

        {title && <div className={styles.header}>
          {title}
          <div className={styles.symbol} aria-hidden="true">✁</div>
        </div>}

        <div className={styles.body}>
          <div className={styles.qrContainer}>
            {qr ? (
              <Image
                src={qr}
                unoptimized
                width={360}
                height={360}
                alt="QR code to download your portrait"
                className={styles.qrImage}
              />
            ) : (
              <div style={{ color: "#333", fontSize: "0.8rem", textAlign: "center" }}>
                Generating Pass…
              </div>
            )}
          </div>
          <div className={styles.passInfo}>
            <em>{dateText}</em>
            <span>{subtitle}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.number}>
            Pass <span className={styles.bold}>{passNumber}</span>
          </div>
          <div className={styles.barcode} aria-hidden="true" />
        </div>

        <div className={`${styles.bg} ${styles.holographic}`} aria-hidden="true" />

        <svg className={styles.filter} aria-hidden="true">
          <filter id="bump">
            <feTurbulence result="noise" numOctaves={3} baseFrequency="0.7" type="fractalNoise" />
            <feSpecularLighting
              in="noise"
              result="specular"
              lightingColor="#fffffc"
              specularExponent={25}
              specularConstant="0.8"
              surfaceScale="0.15"
            >
              <fePointLight z={210} y={100} x={100} />
            </feSpecularLighting>
            <feComposite result="noise2" operator="in" in="specular" in2="SourceGraphic" />
            <feBlend mode="screen" in2="noise2" in="SourceGraphic" />
          </filter>
        </svg>
      </div>
    </div>
  );
}
