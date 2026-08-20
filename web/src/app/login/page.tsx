import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-full bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <p className="text-base font-semibold text-zinc-900">Intranet</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Entrar
        </h1>
        <p className="mt-2 mb-8 text-sm leading-6 text-zinc-600">
          Mesma conta do HumHub. Feed, espaços, pessoas, avisos e chat usam os
          dados que já existem.
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
