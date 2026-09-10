import { createContext, PropsWithChildren, useContext, useCallback, useState, useEffect } from "react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthAccount = {
  id: string;
  firmName: string;
};

type AuthState = {
  user: AuthUser | null;
  account: AuthAccount | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { firmName: string; name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setAccount(data.account);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al iniciar sesión");
    }
    const data = await res.json();
    setUser(data.user);
    setAccount(data.account);
  }, []);

  const signup = useCallback(async (input: { firmName: string; name: string; email: string; phone: string; password: string }) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear la cuenta");
    }
    const data = await res.json();
    setUser(data.user);
    setAccount(data.account);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setAccount(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, account, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
