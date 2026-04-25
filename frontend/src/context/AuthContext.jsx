import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "ccgpt_auth_token";

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload) return false;
  // Check expiry (exp is in seconds)
  return payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = useCallback((newToken) => {
    const payload = parseJwt(newToken);
    if (!payload) return;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser({ userId: payload.userId, email: payload.email, displayName: payload.displayName });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // On mount: check URL for ?token= (OAuth redirect) or restore from localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      login(urlToken);
      // Clean URL
      params.delete("token");
      const newSearch = params.toString();
      window.history.replaceState({}, "", newSearch ? `?${newSearch}` : window.location.pathname);
      return;
    }

    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && isTokenValid(stored)) {
      login(stored);
    } else if (stored) {
      // Expired — clean up
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [login]);

  const isLoggedIn = !!token && isTokenValid(token);

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
