import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "../api/auth.js";
import { setAccessToken, ApiError } from "../api/client.js";

const REFRESH_TOKEN_KEY = "nh_refresh_token";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  becomeHost: (data: {
    displayName: string;
    payoutEmail: string;
    acceptedTerms: true;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ponytail: guards against React 18 StrictMode double-invoking the effect,
  // which would present the same refresh token twice and trigger theft detection.
  const refreshStarted = useRef(false);

  useEffect(() => {
    if (refreshStarted.current) return;
    refreshStarted.current = true;

    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefresh) {
      setIsLoading(false);
      return;
    }
    authApi
      .refresh(storedRefresh)
      .then(({ accessToken, refreshToken, user: u }) => {
        setAccessToken(accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        setUser(u);
      })
      .catch((err: unknown) => {
        // Only clear the stored token on explicit auth rejections (401/403).
        // Transient errors (network, 500) should not force logout.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, refreshToken, user: u } = await authApi.login(email, password);
    setAccessToken(accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setUser(u);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { accessToken, refreshToken, user: u } = await authApi.register(email, password);
    setAccessToken(accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setUser(u);
  }, []);

  const becomeHost = useCallback(
    async (data: { displayName: string; payoutEmail: string; acceptedTerms: true }) => {
      const { accessToken, roles } = await authApi.becomeHost(data);
      setAccessToken(accessToken);
      setUser((prev) => (prev ? { ...prev, roles } : prev));
    },
    [],
  );

  const logout = useCallback(async () => {
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefresh) {
      await authApi.logout(storedRefresh).catch(() => {});
    }
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, becomeHost }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
