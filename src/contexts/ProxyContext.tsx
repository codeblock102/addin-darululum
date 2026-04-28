/**
 * ProxyContext — Admin "View As" impersonation
 *
 * Allows an admin to browse the app as any teacher or parent without
 * changing the Supabase auth session. The admin's JWT stays in place
 * (so full RLS access is preserved) but the UI renders in the
 * proxied user's role: sidebar nav, dashboard, and data queries all
 * use the proxied user's ID and role.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ProxyRole = "teacher" | "parent";

export interface ProxyState {
  active: boolean;
  userId: string;
  role: ProxyRole;
  name: string;
  email: string;
}

interface ProxyContextValue {
  proxy: ProxyState;
  startProxy: (userId: string, role: ProxyRole, name: string, email: string) => void;
  exitProxy: () => void;
}

const defaultProxy: ProxyState = {
  active: false,
  userId: "",
  role: "teacher",
  name: "",
  email: "",
};

const ProxyContext = createContext<ProxyContextValue>({
  proxy: defaultProxy,
  startProxy: () => {},
  exitProxy: () => {},
});

export const ProxyProvider = ({ children }: { children: ReactNode }) => {
  const [proxy, setProxy] = useState<ProxyState>(defaultProxy);

  const startProxy = useCallback(
    (userId: string, role: ProxyRole, name: string, email: string) => {
      setProxy({ active: true, userId, role, name, email });
    },
    [],
  );

  const exitProxy = useCallback(() => {
    setProxy(defaultProxy);
  }, []);

  return (
    <ProxyContext.Provider value={{ proxy, startProxy, exitProxy }}>
      {children}
    </ProxyContext.Provider>
  );
};

export const useProxy = () => useContext(ProxyContext);
