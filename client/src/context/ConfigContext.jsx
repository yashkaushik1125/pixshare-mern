import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const DEFAULTS = {
  name: "Circle ",
  description: "Trusted land and home listings from licensed brokers.",
  primaryColor: "#d4af37",
  accentColor: "#e8c86e",
  roles: {
    admin: {
      label: "Admin",
      color: "#d4af37",
      can: { view: true, post: true, manageUsers: true, deleteAny: true },
    },
    editor: {
      label: "Broker",
      color: "#f5f5f5",
      can: { view: true, post: true, manageUsers: false, deleteAny: false },
    },
    viewer: {
      label: "Viewer",
      color: "#9ca3af",
      can: { view: true, post: false, manageUsers: false, deleteAny: false },
    },
  },
};

const ConfigContext = createContext(DEFAULTS);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);

  useEffect(() => {
    api
      .get("/config")
      .then((res) => setConfig({ ...DEFAULTS, ...res.data }))
      .catch(() => {}); // fall back to defaults if API not reachable yet
  }, []);

  // Apply branding colors + document title whenever config changes.
  useEffect(() => {
    document.documentElement.style.setProperty("--primary", config.primaryColor);
    document.documentElement.style.setProperty("--accent", config.accentColor);
    document.title = config.name;
  }, [config]);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);

// Capability helper shared across the UI.
export function useCan(roles, role) {
  return (capability) => Boolean(roles?.[role]?.can?.[capability]);
}
