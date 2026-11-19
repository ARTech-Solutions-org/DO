import "server-only";

export interface DisplayState {
  status: "idle" | "photo";
  photoUrl?: string;
  jobId?: string;
  updatedAt: number;
}

// In-memory single-source-of-truth for the secondary display
let currentState: DisplayState = {
  status: "idle",
  updatedAt: Date.now(),
};

type Listener = (state: DisplayState) => void;
const listeners = new Set<Listener>();

export function getDisplayState(): DisplayState {
  return currentState;
}

export function setDisplayState(update: Partial<DisplayState>): DisplayState {
  currentState = {
    ...currentState,
    ...update,
    updatedAt: Date.now(),
  };
  for (const listener of listeners) {
    try {
      listener(currentState);
    } catch {
      // ignore individual listener failure
    }
  }
  return currentState;
}

export function subscribeDisplayState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
