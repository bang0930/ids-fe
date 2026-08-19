// fetch 에 타임아웃을 건다 — 백엔드가 죽어 있어도 브라우저 기본 타임아웃(20초+)까지
// 매달리지 않고 정해진 시간 안에 빠르게 실패한다(대시보드 로딩 무한대기 방지).

import { REQUEST_TIMEOUT_MS } from "./config";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export const AUTH_EXPIRED_EVENT = "ids:auth-expired";

let csrfToken: string | null = null;

/**
 * /auth/me에서 받은 CSRF 토큰을 메모리에만 보관한다.
 * Keycloak 토큰과 세션 쿠키는 HttpOnly라 이 코드에서 직접 다루지 않는다.
 */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  // 백엔드는 모든 상태 변경 요청에 CSRF를 검사한다. 호출부가 명시한 값은 덮어쓰지 않는다.
  if (!SAFE_METHODS.has(method) && csrfToken && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  try {
    const response = await fetch(input, {
      ...init,
      credentials: init.credentials ?? "include",
      headers,
      signal: controller.signal,
    });

    // 만료된 세션을 발견한 어느 API 호출이든 AuthContext가 즉시 상태를 비우게 한다.
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("서버 응답이 없어 연결을 중단했어요. 잠시 후 다시 시도해주세요.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
