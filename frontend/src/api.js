const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request to ${path} failed: ${response.status}`);
  }
  return response.json();
}

export function fetchSampleLayout() {
  return request("/api/v1/graph/layout/");
}

export function fetchLayoutFor(nodes, edges) {
  return request("/api/v1/graph/layout/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodes, edges }),
  });
}

export function fetchCatalog() {
  return request("/api/v1/graph/catalog/");
}

export function initSession({ pid, tool, sgic, classroomCode } = {}) {
  const params = new URLSearchParams();
  if (sgic) params.set("sgic", sgic);
  if (pid) params.set("pid", pid);
  if (tool) params.set("tool", tool);
  if (classroomCode) params.set("classroom_code", classroomCode);
  return request(`/api/v1/sessions/init/?${params.toString()}`);
}

export function resumeSession(sgic) {
  return request(`/api/v1/sessions/resume/?sgic=${encodeURIComponent(sgic)}`);
}

export function saveSession(sgic, payload) {
  return request(`/api/v1/sessions/${encodeURIComponent(sgic)}/save/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
