interface BoothConfig {
  display: { width: number; height: number; confirmed: boolean };
  styles: readonly {
    id: string;
    label: string;
    enabled: boolean;
    sample: { full: string; compact: string; width: number; height: number };
  }[];
  theme: { portraitBackground: string; ink: string; paper: string; accent: string };
  countdownSeconds: number;
  qrIdleSeconds: number;
  thankYouSeconds: number;
}

export const boothConfig = {
  display: { width: 1080, height: 1920, confirmed: false },
  styles: [{
    id: "caricature",
    label: "Caricature",
    enabled: true,
    sample: {
      full: "/artwork/web/caricature-sample-full.webp",
      compact: "/artwork/web/caricature-sample-compact.webp",
      width: 1195,
      height: 1316,
    },
  }],
  theme: { portraitBackground: "#966BFC", ink: "#000000", paper: "#FFFFFF", accent: "#E48D3D" },
  countdownSeconds: 3,
  qrIdleSeconds: 60,
  thankYouSeconds: 6,
} as const satisfies BoothConfig;

export type StyleId = (typeof boothConfig.styles)[number]["id"];
export const enabledStyles = boothConfig.styles.filter((style) => style.enabled);
