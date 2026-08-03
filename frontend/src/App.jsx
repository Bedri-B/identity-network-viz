import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PhaseShell from "./components/PhaseShell";
import CardDiscovery from "./pages/CardDiscovery";
import ImportanceRating from "./pages/ImportanceRating";
import PairwiseMapping from "./pages/PairwiseMapping";
import QualtricsRedirect from "./pages/QualtricsRedirect";
import Report from "./pages/Report";
import SampleDemo from "./pages/SampleDemo";
import { SessionProvider, useSession } from "./session/SessionContext";

function BootstrapStatus() {
  const { status, error } = useSession();
  if (status === "error") {
    return (
      <p className="status-line status-error">
        Couldn&apos;t reach the backend at the configured API base: {String(error?.message ?? error)}
      </p>
    );
  }
  return <p className="status-line">Initializing session…</p>;
}

function RequireSession({ children }) {
  const { status } = useSession();
  if (status !== "ready") return <BootstrapStatus />;
  return children;
}

function Home() {
  const { status, session } = useSession();
  if (status !== "ready") return <BootstrapStatus />;
  return <Navigate to={`/phase/${session.current_phase}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/phase/1"
              element={
                <RequireSession>
                  <PhaseShell>
                    <CardDiscovery />
                  </PhaseShell>
                </RequireSession>
              }
            />
            <Route
              path="/phase/3"
              element={
                <RequireSession>
                  <PhaseShell>
                    <ImportanceRating />
                  </PhaseShell>
                </RequireSession>
              }
            />
            <Route
              path="/phase/4"
              element={
                <RequireSession>
                  <PhaseShell>
                    <PairwiseMapping />
                  </PhaseShell>
                </RequireSession>
              }
            />
            <Route
              path="/phase/5"
              element={
                <RequireSession>
                  <PhaseShell>
                    <QualtricsRedirect />
                  </PhaseShell>
                </RequireSession>
              }
            />
            <Route
              path="/phase/6"
              element={
                <RequireSession>
                  <PhaseShell>
                    <Report />
                  </PhaseShell>
                </RequireSession>
              }
            />
            <Route path="/sample" element={<SampleDemo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SessionProvider>
    </BrowserRouter>
  );
}
