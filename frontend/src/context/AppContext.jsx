import React, { createContext, useReducer, useEffect } from "react";
import { reducer, initialState } from "./reducer.js";
import { ACTIONS } from "./actions.js";
import {
  loadSettings,
  saveSettings,
  loadApiKeys,
  saveApiKeys,
  loadConversations,
  saveConversations,
  loadActiveId,
  saveActiveId,
} from "../services/storage.js";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const settings = loadSettings() ?? {};
    const { groqApiKey, nvidiaApiKey } = loadApiKeys();
    const conversations = loadConversations();
    const activeConversationId = loadActiveId();
    dispatch({
      type: ACTIONS.LOAD_STATE,
      payload: { ...settings, groqApiKey, nvidiaApiKey, conversations, activeConversationId },
    });
  }, []);

  // Persist settings changes
  useEffect(() => {
    saveSettings({
      model: state.model,
      systemPrompt: state.systemPrompt,
      temperature: state.temperature,
      maxTokens: state.maxTokens,
      memoryEnabled: state.memoryEnabled,
      memoryCutoff: state.memoryCutoff,
    });
  }, [state.model, state.systemPrompt, state.temperature, state.maxTokens, state.memoryEnabled, state.memoryCutoff]);

  // Persist API keys changes
  useEffect(() => {
    saveApiKeys({ groqApiKey: state.groqApiKey, nvidiaApiKey: state.nvidiaApiKey });
  }, [state.groqApiKey, state.nvidiaApiKey]);

  // Persist conversations (only when not mid-stream to avoid excessive writes)
  useEffect(() => {
    if (!state.isStreaming) {
      saveConversations(state.conversations);
    }
  }, [state.conversations, state.isStreaming]);

  // Persist active conversation id
  useEffect(() => {
    saveActiveId(state.activeConversationId);
  }, [state.activeConversationId]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
