import { useContext } from "react";
import { AppContext } from "../context/AppContext.jsx";

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
