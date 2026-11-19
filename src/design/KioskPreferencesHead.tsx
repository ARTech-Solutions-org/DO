"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";
import { restoreKioskTheme } from "./kiosk-theme";

export function KioskPreferencesHead() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    // A streamed response can flush the head more than once.
    if (inserted.current) return null;
    inserted.current = true;
    return <script id="kiosk-preferences" dangerouslySetInnerHTML={{ __html: restoreKioskTheme }} />;
  });
  return null;
}
