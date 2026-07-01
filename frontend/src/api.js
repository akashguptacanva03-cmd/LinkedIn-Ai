// LinkedPilot AI — API client
// Connects the frontend to the real FastAPI backend at http://localhost:8000
//
// Usage in the React artifact: replace localStorage-based state and direct
// AI-provider fetch() calls with these functions instead.

const API_BASE = "http://localhost:8000/api";

function getToken() {
  return window.__lp_token || null;
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signup = (email, password, name) =>
  request("POST", "/auth/signup", { email, password, name });

export const login = (email, password) =>
  request("POST", "/auth/login", { email, password });

export const getMe = () => request("GET", "/auth/me");

// ── LinkedIn ──────────────────────────────────────────────────────────────────
export const connectLinkedIn = () => request("GET", "/linkedin/connect");
export const linkedInStatus = () => request("GET", "/linkedin/status");
export const disconnectLinkedIn = () => request("POST", "/linkedin/disconnect");

// ── Posts ─────────────────────────────────────────────────────────────────────
export const listPosts = (status) => request("GET", `/posts${status ? `?status=${status}` : ""}`);
export const createPost = (data) => request("POST", "/posts", data);
export const updatePost = (id, data) => request("PATCH", `/posts/${id}`, data);
export const deletePost = (id) => request("DELETE", `/posts/${id}`);
export const approvePost = (id) => request("POST", `/posts/${id}/approve`);
export const rejectPost = (id, reason, rejectType) =>
  request("POST", `/posts/${id}/reject`, { reason, reject_type: rejectType });
export const regeneratePost = (id) => request("POST", `/posts/${id}/regenerate`);

// ── Generate ──────────────────────────────────────────────────────────────────
export const generateContent = (topic, tone, keywords, provider, generateImage = true) =>
  request("POST", "/content/generate", { topic, tone, keywords, provider, generate_image: generateImage });

// ── Automation Pipeline ───────────────────────────────────────────────────────
export const listTopics = () => request("GET", "/automation/topics");
export const addTopic = (topic, tone) => request("POST", "/automation/topics", { topic, tone });
export const toggleTopic = (id) => request("PATCH", `/automation/topics/${id}/toggle`);
export const deleteTopic = (id) => request("DELETE", `/automation/topics/${id}`);
export const getPipelineSettings = () => request("GET", "/automation/settings");
export const updatePipelineSettings = (data) => request("PATCH", "/automation/settings", data);
export const runPipelineNow = () => request("POST", "/automation/run");

// ── Manual Post ───────────────────────────────────────────────────────────────
export const manualPost = (content, imageUrl, scheduledAt) =>
  request("POST", "/manual/post", { content, image_url: imageUrl, scheduled_at: scheduledAt });

// ── Research ──────────────────────────────────────────────────────────────────
export const researchChat = (messages, niche, provider) =>
  request("POST", "/research/chat", { messages, niche, provider });
export const analyzeAccount = (provider) => request("POST", "/research/analyze", { provider });
export const getTopicIdeas = (niche, audience, style, provider) =>
  request("POST", "/research/topic-ideas", { niche, audience, style, provider });

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () => request("GET", "/settings");
export const updateApiKeys = (openaiKey, geminiKey) =>
  request("PATCH", "/settings/api-keys", { openai_key: openaiKey, gemini_key: geminiKey });
