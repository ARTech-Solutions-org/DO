import Image from "next/image";
import styles from "./BrandHeader.module.css";

export function BrandHeader({ className }: { className?: string }) {
  return (
    <header className={`${styles.brandHeader} ${className || ""}`} aria-label="Event partners">
      <div className={styles.logos}>
        <Image
          src="/artwork/brand/do-hotels-header.png"
          alt="DO Hotels"
          width={211}
          height={146}
          className={styles.doLogo}
          priority
          unoptimized
        />
        <span className={styles.divider} aria-hidden="true" />
        <Image
          src="/artwork/brand/one-development-header.png"
          alt="ONE Development"
          width={341}
          height={163}
          className={styles.oneLogo}
          priority
          unoptimized
        />
      </div>
    </header>
  );
}
