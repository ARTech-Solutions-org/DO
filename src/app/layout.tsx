import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { KioskPreferencesHead } from "../design/KioskPreferencesHead";
import "./globals.css";

export const metadata: Metadata = { title: "DO Hotels / ONE Development · Photo Booth" };

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="purple" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Montserrat:wght@700;800;900&family=Outfit:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <KioskPreferencesHead />
        <main>{children}</main>
      </body>
    </html>
  );
}
