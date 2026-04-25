import { useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function buildMemoryPrompt(memories) {
  if (!memories || memories.length === 0) return "";
  const lines = memories.map((m) => `- ${m.content}`).join("\n");
  return `[使用者記憶]\n${lines}\n\n`;
}

export function useMemory() {
  const { token, isLoggedIn } = useAuth();

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  const fetchMemories = useCallback(async () => {
    if (!isLoggedIn) return [];
    const res = await fetch(`${API_BASE}/api/memory`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  }, [isLoggedIn, token]);

  const addMemory = useCallback(async (content) => {
    if (!isLoggedIn) return null;
    const res = await fetch(`${API_BASE}/api/memory`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to add memory");
    }
    const entry = await res.json();
    window.dispatchEvent(new CustomEvent("memory-updated"));
    return entry;
  }, [isLoggedIn, token]);

  const deleteMemory = useCallback(async (id) => {
    if (!isLoggedIn) return;
    await fetch(`${API_BASE}/api/memory/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  }, [isLoggedIn, token]);

  const extractMemories = useCallback(async (messages, model, apiKey) => {
    if (!isLoggedIn) return { extracted: [] };
    const res = await fetch(`${API_BASE}/api/memory/extract`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ messages, model, apiKey }),
    });
    if (!res.ok) {
      const status = res.status;
      throw new Error(status === 401 ? "auth" : "request_failed");
    }
    const result = await res.json();
    if (result.extracted?.length > 0) {
      window.dispatchEvent(new CustomEvent("memory-updated"));
    }
    return result;
  }, [isLoggedIn, token]);

  return { fetchMemories, addMemory, deleteMemory, extractMemories };
}
