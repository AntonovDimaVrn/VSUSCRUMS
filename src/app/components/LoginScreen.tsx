import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";

export function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(135deg,_#f8fafc_0%,_#e2e8f0_45%,_#dbeafe_100%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/70 bg-white/75 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <ShieldCheck size={16} />
              Frontend auth preview
            </div>

            <div className="mt-8 max-w-xl">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                ScrumMetrics
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Войдите в платформу, чтобы продолжить работу с аналитикой команды,
                проектами и загрузкой данных.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Проекты и история загрузок сохраняются локально
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Вход работает как mock-flow без backend API
              </div>
            </div>
          </section>

          <section className="rounded-[32px] bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
                  Доступ к рабочему пространству
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight">
                  Откройте dashboard и продолжайте с того места, где остановились.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  После входа вернётся основной интерфейс приложения. Данные проектов
                  и история импортов не будут сброшены.
                </p>
              </div>

              <Button
                onClick={login}
                size="lg"
                className="mt-10 w-full bg-blue-600 text-white hover:bg-blue-500"
              >
                Войти
                <ArrowRight size={18} />
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
