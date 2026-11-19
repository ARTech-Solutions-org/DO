import Image from "next/image";
import { SaveButton } from "../../../design/SaveButton";
import { headers } from "next/headers";
import type { Metadata } from "next";
import styles from "../../../booth/Delivery.module.css";
import { openDownload } from "../../../server/delivery/links";

export const metadata: Metadata = { title: "Your photo · DO Hotels", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Download({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const host = (await headers()).get("host");
  const link = await openDownload(token, host).catch(() => null);
  if (!link || !await link.read().catch(() => null)) return <section className={styles.mobile}><h1>Photo unavailable</h1><p>This link may have expired.</p></section>;
  const file = "/download/" + encodeURIComponent(token) + "/file";
  return <section className={styles.mobile}>
    <h1>Your photo</h1>
    {link.local && <small>NONPUBLIC DEVELOPMENT PREVIEW</small>}
    <Image src={file} unoptimized width={link.artifact.width} height={link.artifact.height} alt="Your caricature portrait" />
    <SaveButton href={file + "?save=1"} download label="SAVE PHOTO" savedLabel="SAVED! ✓" />
  </section>;
}
