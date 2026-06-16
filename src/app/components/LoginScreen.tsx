import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";

export function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-8">
            <div className="inline-flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              <ShieldCheck size={16} />
              Прототип для ВКР
            </div>

            <div className="mt-8 max-w-xl">
              <h1 className="text-4xl font-semibold text-slate-950">
                SCRUMS
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Вход в систему анализа спринтов, заявок и трудозатрат команды.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
                Расчёты идут по Excel-файлу
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
                Данные можно проверить в разделе загрузки
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-slate-900 p-8 text-white">
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="text-sm uppercase text-blue-200">
                  Вход
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight">
                  Открыть обзор аналитики.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  После входа доступны загрузка Excel, анализ спринтов, команда и математическая модель.
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
