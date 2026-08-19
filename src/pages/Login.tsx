import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, ShieldCheck, FlaskConical, ArrowRight, AlertCircle } from "lucide-react"
import { Logo } from "@/components/logo"

export default function Login() {
  const { state, startLogin, refreshSession } = useAuth()

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-card lg:block">
        <div className="aurora pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>

          <div className="max-w-md">
            <p className="eyebrow mb-4">아주대 구성원 전용</p>
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              아주대 계정 하나로,
              <br />
              번거로운 가입 없이.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              학교 SSO가 신원을 확인하니 따로 가입할 필요가 없습니다.
              <br />
              학교 계정으로 예측·배포까지 곧장 이어집니다.
            </p>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            아주대학교 아올다(Aolda) 클라우드 위에서 동작합니다
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight">launcha</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">시작하기</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              아주대학교 계정으로 로그인하면 바로 이용할 수 있어요. 별도 가입은 필요 없습니다.
            </p>
          </div>

          {state.error && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{state.error}</span>
                <button
                  type="button"
                  className="shrink-0 underline underline-offset-2"
                  onClick={() => void refreshSession()}
                >
                  다시 확인
                </button>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => startLogin("/predict")}
            size="lg"
            className="w-full"
            variant="hero"
          >
            <GraduationCap className="h-4 w-4" />
            아주대학교 SSO로 로그인
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            학교 계정이 곧 로그인입니다 · 별도 가입 없음
          </p>

          <div className="mt-8 flex gap-3 rounded-lg border border-border bg-card p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-sm text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">토큰은 브라우저에 저장하지 않아요</p>
              Keycloak 토큰은 백엔드와 Redis에만 보관하고, 브라우저에는 HttpOnly 세션 쿠키만 사용합니다.
            </div>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            로그인 없이 둘러보기
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button asChild size="lg" className="w-full" variant="outline">
            <Link to="/demo">
              <FlaskConical className="h-4 w-4" /> 데모 둘러보기 <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
