'use client'

import { Suspense } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { registerCustomer } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function CadastroForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const [state, action, pending] = useActionState(registerCustomer, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl shadow-lg">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-500">Faça pedidos nos melhores restaurantes</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <form action={action} className="space-y-4">
            <input type="hidden" name="redirect" value={redirect} />

            {state?.message && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.message}</div>
            )}

            <Input
              label="Nome completo"
              name="name"
              placeholder="Seu nome"
              error={state?.errors?.name?.[0]}
              required
            />
            <Input
              label="Celular"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              error={state?.errors?.phone?.[0]}
              required
            />
            <Input
              label="Email (opcional)"
              name="email"
              type="email"
              placeholder="seu@email.com"
              error={state?.errors?.email?.[0]}
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              error={state?.errors?.password?.[0]}
              required
            />

            <Button type="submit" className="w-full" size="lg" loading={pending}>
              Criar conta
            </Button>

            <p className="text-center text-sm text-gray-500">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-orange-500 hover:text-orange-600">
                Fazer login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  )
}
