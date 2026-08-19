import { API_BASE_URL } from "./config";
import { fetchWithTimeout } from "./http";

export interface AuthUser {
  id: number;
  email: string;
  email_verified: boolean;
  preferred_username: string | null;
  name: string | null;
  ajou_major: string | null;
  ajou_grade: string | null;
  ajou_status: string | null;
  roles: string[];
}

export interface AuthSession {
  authenticated: true;
  user: AuthUser;
  csrf_token: string;
}

export type LogoutResult =
  | { status: "completed" }
  | { status: "pending" }
  | { status: "failed"; errorCode: string | null };

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

const AUTH_BASE_URL = `${API_BASE_URL}/api/v1/auth`;

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return body.detail || body.message || fallback;
  } catch {
    return response.statusText || fallback;
  }
}

export const authApi = {
  startLogin(nextPath = "/predict"): void {
    const next = encodeURIComponent(nextPath);
    window.location.assign(`${AUTH_BASE_URL}/login?next=${next}`);
  },

  async getSession(): Promise<AuthSession | null> {
    const response = await fetchWithTimeout(`${AUTH_BASE_URL}/me`);
    if (response.status === 401) return null;
    if (!response.ok) {
      throw new AuthApiError(
        await errorMessage(response, "로그인 상태를 확인하지 못했습니다."),
        response.status,
      );
    }
    return response.json() as Promise<AuthSession>;
  },

  async logout(csrfToken: string): Promise<LogoutResult> {
    const response = await fetchWithTimeout(`${AUTH_BASE_URL}/logout`, {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    });

    if (response.status === 204) return { status: "completed" };
    if (response.status === 202) return { status: "pending" };
    if (response.status === 502) {
      const body = await response.json().catch(() => ({}));
      return {
        status: "failed",
        errorCode: typeof body.error_code === "string" ? body.error_code : null,
      };
    }
    throw new AuthApiError(
      await errorMessage(response, "로그아웃하지 못했습니다."),
      response.status,
    );
  },
};
