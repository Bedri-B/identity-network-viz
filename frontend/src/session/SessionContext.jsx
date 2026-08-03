import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initSession, resumeSession, saveSession } from "../api";

const SessionCtx = createContext(null);
const STORAGE_KEY = "identity-network-viz:sgic";

export function SessionProvider({ children }) {
  const [status, setStatus] = useState("bootstrapping"); // bootstrapping | ready | error
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSgic = params.get("sgic");
    const pid = params.get("pid");
    const tool = params.get("tool");
    const classroomCode = params.get("classroom_code");
    const storedSgic = window.localStorage.getItem(STORAGE_KEY);

    async function bootstrap() {
      try {
        let data;
        if (urlSgic) {
          data = await resumeSession(urlSgic);
        } else if (pid || tool || classroomCode) {
          data = await initSession({ pid, tool: tool ?? "adult_variant_a", classroomCode });
        } else if (storedSgic) {
          data = await resumeSession(storedSgic).catch(() => initSession({}));
        } else {
          data = await initSession({});
        }
        window.localStorage.setItem(STORAGE_KEY, data.sgic);
        setSession(data);
        setStatus("ready");
      } catch (err) {
        setError(err);
        setStatus("error");
      }
    }

    bootstrap();
    // Bootstrap reads window.location.search once on first mount by design --
    // phase navigation afterwards happens via React Router, not URL reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = useCallback(
    async (statePatch, { phase, status: nextStatus } = {}) => {
      if (!session) return undefined;
      const payload = {};
      if (statePatch) payload.state_patch = statePatch;
      if (phase) payload.current_phase = phase;
      if (nextStatus) payload.status = nextStatus;
      const updated = await saveSession(session.sgic, payload);
      setSession(updated);
      return updated;
    },
    [session]
  );

  const value = useMemo(() => ({ status, session, error, patch }), [status, session, error, patch]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
