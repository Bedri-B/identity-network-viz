const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export async function fetchSampleLayout() {
  const response = await fetch(`${API_BASE}/api/v1/graph/layout/`);
  if (!response.ok) {
    throw new Error(`Layout request failed: ${response.status}`);
  }
  return response.json();
}
