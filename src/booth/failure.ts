export const messages = {
  camera: "Check the camera connection, then try again.",
  "camera-denied": "Allow camera access in the browser, then try again.",
  "camera-disconnected": "Reconnect the camera, then try again.",
  capture: "The photo could not be captured. Try the camera again.",
  "local-storage": "Allow browser storage for the booth, then try again.",
  "capture-missing": "This capture is unavailable. Start a new session.",
  generation: "Your look could not be created. Start a new session.",
  "generation-timeout": "Generation timed out. Start a new session.",
  "rate-limit": "The booth is at its generation limit. Try again in a minute.",
  offline: "Check the booth connection, then try again.",
  export: "Your photo is ready. Try saving it again.",
  result: "Your photo could not be loaded. Reconnect and try again.",
  link: "The download link is unavailable. Try to reopen it.",
  "link-expired": "This download is missing or expired. Try reopening the link.",
} as const;

export type FailureReason = keyof typeof messages;

export function requiresNewSession(reason?: FailureReason) {
  return reason === "generation" || reason === "generation-timeout" || reason === "rate-limit" || reason === "capture-missing";
}

export function cameraFailure(error: unknown): FailureReason {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "camera-denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "camera-disconnected";
  return "camera";
}
