import type { ComponentPropsWithRef } from "react";
import styles from "./PartyButton.module.css";

type Appearance = {
  variant?: "primary" | "outline" | "orange" | "glass";
  size?: "regular" | "compact";
  icon?: "scan" | "refresh";
};
type ButtonProps = ComponentPropsWithRef<"button"> & Appearance & { loading?: boolean };
type LinkProps = ComponentPropsWithRef<"a"> & Appearance;

function Icon({ name }: { name: NonNullable<Appearance["icon"]> }) {
  return <span className={styles.icon} data-icon={name} aria-hidden="true">
    {name === "scan" ? <svg viewBox="0 0 32 32" fill="none">
      <path className={styles.brackets} d="M11 3H5Q3 3 3 5v6m18-8h6q2 0 2 2v6M3 21v6q0 2 2 2h6m10 0h6q2 0 2-2v-6" />
      <path stroke="currentColor" strokeWidth="1.7" d="M8 8h6v6H8zm10 0h6v6h-6zM8 18h6v6H8zm10 0h3v3h3v3h-3m3-6h1m-7 3v4" />
    </svg> : <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13a11 11 0 0 1 19-5l3 3m0-6v6h-6M27 19a11 11 0 0 1-19 5l-3-3m0 6v-6h6" />
    </svg>}
  </span>;
}

export function PartyButton({ variant = "primary", size = "regular", icon, loading = false,
  disabled, className, children, type = "button", ...props }: ButtonProps) {
  return <button {...props} className={[styles.party, className].filter(Boolean).join(" ")} type={type}
    data-party={variant} data-size={size} disabled={disabled || loading} aria-busy={loading || props["aria-busy"]}>
    {icon && <Icon name={icon} />}<span className={styles.label}>{children}</span>
  </button>;
}

export function PartyLink({ variant = "outline", size = "regular", icon, className, children, ...props }: LinkProps) {
  return <a {...props} className={[styles.party, className].filter(Boolean).join(" ")} data-party={variant} data-size={size}>
    {icon && <Icon name={icon} />}<span className={styles.label}>{children}</span>
  </a>;
}
