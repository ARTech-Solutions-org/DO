"use client";

import { useReducer } from "react";
import { enabledStyles } from "../booth/config";
import { transition, welcome, type BoothEvent, type BoothState } from "../booth/flow";

const headings: Record<BoothState["stage"], string> = {
  welcome: "Welcome", "choose-style": "Choose Your Style", camera: "Camera", countdown: "Countdown",
  processing: "AI Processing", result: "Final Result", qr: "QR Download", "thank-you": "Thank You", error: "Error & Retry",
};

type Action = { label: string; event: BoothEvent };

function actions(state: BoothState): Action[] {
  switch (state.stage) {
    case "welcome":
      return [{ label: "Simulate consent", event: { type: "consent", sessionId: "demo-session", consentAt: "2000-01-01T00:00:00Z" } }];
    case "choose-style":
      return [
        ...enabledStyles.map((style): Action => ({
          label: state.styleId === style.id ? `${style.label} (selected)` : style.label,
          event: { type: "select-style", styleId: style.id },
        })),
        ...(state.styleId ? [{ label: "Continue", event: { type: "continue" } } as const] : []),
        { label: "Back", event: { type: "back" } },
      ];
    case "camera": return [{ label: "Arm countdown", event: { type: "arm" } }, { label: "Back", event: { type: "back" } }];
    case "countdown": return [{ label: "Simulate capture", event: { type: "captured", jobId: "demo-job" } }, { label: "Cancel", event: { type: "cancel" } }];
    case "processing": return [{ label: "Complete mock job", event: { type: "generated", jobId: state.jobId, resultId: "demo-result" } }];
    case "result": return [{ label: "Simulate QR step", event: { type: "open-qr" } }];
    case "qr": return [{ label: "Done", event: { type: "done" } }];
    case "thank-you": return [{ label: "Return to Welcome", event: { type: "reset" } }];
    case "error": return [{ label: "Retry stage", event: { type: "retry" } }, { label: "Start over", event: { type: "reset" } }];
  }
}

export function Simulator() {
  const [state, dispatch] = useReducer(transition, welcome);
  return (
    <section>
      <p className="status">DEV ONLY · Flow simulator</p>
      <h1 aria-live="polite">{headings[state.stage]}</h1>
      <p>Simulated events only. Camera, generation and downloads are offline.</p>
      {state.stage === "error" && <p>Simulated failure in {headings[state.failed.stage]}.</p>}
      <div className="controls">
        {actions(state).map(({ label, event }) => <button key={label} onClick={() => dispatch(event)}>{label}</button>)}
        {state.stage !== "error" && <button onClick={() => dispatch({ type: "fail" })}>Simulate error</button>}
      </div>
    </section>
  );
}
