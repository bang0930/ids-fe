import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  authApi,
  AuthApiError,
  AuthSession,
  AuthUser,
  LogoutResult,
} from "@/lib/authAPI";
import { AUTH_EXPIRED_EVENT, setCsrfToken } from "@/lib/http";

interface AuthState {
  user: AuthUser | null;
  csrfToken: string | null;
  initialized: boolean;
  loggingOut: boolean;
  error: string | null;
}

interface AuthContextType {
  state: AuthState;
  startLogin: (nextPath?: string) => void;
  logout: () => Promise<LogoutResult>;
  refreshSession: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const anonymousState = (error: string | null = null): AuthState => ({
  user: null,
  csrfToken: null,
  initialized: true,
  loggingOut: false,
  error,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    csrfToken: null,
    initialized: false,
    loggingOut: false,
    error: null,
  });

  const applySession = useCallback((session: AuthSession | null) => {
    const token = session?.csrf_token ?? null;
    setCsrfToken(token);
    setState(
      session
        ? {
            user: session.user,
            csrfToken: session.csrf_token,
            initialized: true,
            loggingOut: false,
            error: null,
          }
        : anonymousState(),
    );
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthSession | null> => {
    try {
      const session = await authApi.getSession();
      applySession(session);
      return session;
    } catch (error) {
      setCsrfToken(null);
      setState(
        anonymousState(
          error instanceof Error
            ? error.message
            : "로그인 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
        ),
      );
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    // 이전 임시 인증값은 실제 백엔드 세션으로 인정하지 않는다.
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ids_dev_session");

    const handleExpired = () => {
      setCsrfToken(null);
      setState(anonymousState("로그인 세션이 만료되었습니다. 다시 로그인해주세요."));
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    void refreshSession();
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [refreshSession]);

  const startLogin = useCallback((nextPath = "/predict") => {
    authApi.startLogin(nextPath);
  }, []);

  const logout = useCallback(async (): Promise<LogoutResult> => {
    setState((current) => ({ ...current, loggingOut: true, error: null }));
    try {
      let csrf = state.csrfToken;
      if (!csrf) {
        const session = await authApi.getSession();
        if (!session) {
          applySession(null);
          return { status: "completed" };
        }
        csrf = session.csrf_token;
        applySession(session);
      }

      let result: LogoutResult;
      try {
        result = await authApi.logout(csrf);
      } catch (error) {
        // 탭을 오래 열어 CSRF가 낡았을 때 현재 세션을 한 번 갱신하고 재시도한다.
        if (!(error instanceof AuthApiError) || error.status !== 403) throw error;
        const session = await authApi.getSession();
        if (!session) {
          applySession(null);
          return { status: "completed" };
        }
        result = await authApi.logout(session.csrf_token);
      }

      // 204/202/502 모두 백엔드가 IDS 쿠키와 로컬 세션을 폐기한 응답이다.
      applySession(null);
      return result;
    } catch (error) {
      setState((current) => ({
        ...current,
        loggingOut: false,
        error: error instanceof Error ? error.message : "로그아웃하지 못했습니다.",
      }));
      throw error;
    }
  }, [applySession, state.csrfToken]);

  return (
    <AuthContext.Provider value={{ state, startLogin, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
