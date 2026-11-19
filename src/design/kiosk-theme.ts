const artworkKey = "do-booth.welcome-artwork";
const preferenceKey = "do-booth.operator-theme";

// The head script runs before the kiosk paints, including on an active-job reload.
export const restoreKioskTheme = `try {
  if (localStorage.getItem(${JSON.stringify(artworkKey)}) === "ball")
    document.documentElement.dataset.welcomeArtwork = "ball";
  if (localStorage.getItem(${JSON.stringify(preferenceKey)}) === "orange")
    document.documentElement.dataset.theme = "orange";
} catch { /* Device storage can be disabled. */ }`;

export function toggleWelcomeArtwork() {
  const root = document.documentElement;
  const current = root.dataset.welcomeArtwork;
  const next = current === "ball" ? "cd" : "ball";
  root.dataset.welcomeArtwork = next;
  try {
    localStorage.setItem(artworkKey, next);
  } catch {
    // The selection remains active while the kiosk page is open.
  }
}

export function toggleKioskTheme() {
  const root = document.documentElement;
  const current = root.dataset.theme;
  const next = current === "orange" ? "purple" : "orange";
  root.dataset.theme = next;
  try {
    localStorage.setItem(preferenceKey, next);
  } catch {
    // The root still keeps the operator's selection for this page lifetime.
  }
}
