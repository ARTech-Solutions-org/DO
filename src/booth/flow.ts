import { enabledStyles, type StyleId } from "./config.ts";
import { requiresNewSession, type FailureReason } from "./failure.ts";

type Session = { sessionId: string; consentAt: string };
type StyledSession = Session & { styleId: StyleId };
type JobSession = StyledSession & { jobId: string };
type ResultSession = JobSession & { resultId: string };

type ActiveState =
  | { stage: "welcome" }
  | ({ stage: "choose-style"; styleId?: StyleId } & Session)
  | ({ stage: "camera" | "countdown" } & StyledSession)
  | ({ stage: "processing" } & JobSession)
  | ({ stage: "result" | "qr" } & ResultSession)
  | { stage: "thank-you" };

export type BoothState = ActiveState | { stage: "error"; failed: ActiveState; reason?: FailureReason };
export type BoothEvent =
  | ({ type: "consent" } & Session)
  | ({ type: "resume-generation" } & JobSession)
  | { type: "select-style"; styleId: StyleId }
  | { type: "continue" | "back" | "arm" | "cancel" | "open-qr" | "done" | "reset" | "retry" }
  | { type: "fail"; reason?: FailureReason }
  | { type: "captured"; jobId: string }
  | { type: "generated"; jobId: string; resultId: string };

export const welcome = { stage: "welcome" } as const;

export function transition(state: BoothState, event: BoothEvent): BoothState {
  if (event.type === "reset") return welcome;
  if (state.stage === "error") {
    if (event.type !== "retry") return state;
    if (requiresNewSession(state.reason)) return welcome;
    return state.failed.stage === "countdown" ? { ...state.failed, stage: "camera" } : state.failed;
  }
  if (event.type === "fail") return { stage: "error", failed: state, ...(event.reason ? { reason: event.reason } : {}) };

  switch (state.stage) {
    case "welcome":
      if (event.type === "resume-generation" && event.jobId && enabledStyles.some(style => style.id === event.styleId)) {
        return { stage: "processing", sessionId: event.sessionId, consentAt: event.consentAt, styleId: event.styleId, jobId: event.jobId };
      }
      if (event.type === "consent" && event.sessionId && event.consentAt) {
        return { stage: "choose-style", sessionId: event.sessionId, consentAt: event.consentAt };
      }
      break;
    case "choose-style":
      if (event.type === "back") return welcome;
      if (event.type === "select-style" && enabledStyles.some((s) => s.id === event.styleId)) {
        return { ...state, styleId: event.styleId };
      }
      if (event.type === "continue" && state.styleId) {
        return { ...state, stage: "camera", styleId: state.styleId };
      }
      break;
    case "camera":
      if (event.type === "back") {
        return { ...state, stage: "choose-style" };
      }
      if (event.type === "arm") return { ...state, stage: "countdown" };
      break;
    case "countdown":
      if (event.type === "cancel") return { ...state, stage: "camera" };
      if (event.type === "captured" && event.jobId) return { ...state, stage: "processing", jobId: event.jobId };
      break;
    case "processing":
      if (event.type === "generated" && event.jobId === state.jobId && event.resultId) {
        return { ...state, stage: "result", resultId: event.resultId };
      }
      break;
    case "result":
      if (event.type === "open-qr") return { ...state, stage: "qr" };
      break;
    case "qr":
      if (event.type === "done") return { stage: "thank-you" };
      break;
    case "thank-you":
      break;
  }
  return state;
}
