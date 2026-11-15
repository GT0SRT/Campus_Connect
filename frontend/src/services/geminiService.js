import { fileToBase64 } from "./cloudinaryService";
import api from "./api";

function getBackendAiUrl() {
  const base = api.defaults?.baseURL || '';
  return base.replace(/\/+$/, '');
}

const LEGACY_API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const CAPTION_API_URL = (
  import.meta.env.VITE_CAPTION_API_URL ||
  (LEGACY_API_BASE ? `${LEGACY_API_BASE}/generate` : '')
)?.replace(/\/$/, "");

export async function generateCaptionFromImageFile(file, instruction = "") {
  const apiUrl = CAPTION_API_URL;
  if (!apiUrl) {
    throw new Error("Caption API URL not configured. Set VITE_CAPTION_API_URL or VITE_API_BASE_URL.");
  }
  const base64 = await fileToBase64(file);
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, instruction }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.detail || errorData?.error || "Failed to generate caption");
  }
  const data = await response.json();
  return data.caption || "";
}

export async function chatWithGemini(message) {
  try {
    const res = await api.post('/ai/chat', { message });
    return res.data?.reply || '';
  } catch {
    if (!LEGACY_API_BASE) throw new Error('AI chat unavailable');
    const response = await fetch(`${LEGACY_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to get chat response');
    const data = await response.json();
    return data?.reply || '';
  }
}

export async function aiDraft(context) {
  const res = await api.post('/ai/draft', { context });
  return res.data?.text || '';
}

export async function aiIcebreaker(name, context) {
  const res = await api.post('/ai/icebreaker', { name, context });
  return res.data?.text || '';
}
