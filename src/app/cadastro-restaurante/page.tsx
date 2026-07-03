'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerRestaurant } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CadastroRestaurantePage() {
  const [state, action, pending] = useActionState(registerRestaurant, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl shadow-lg">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastrar Restaurante</h1>
          <p className="mt-1 text-sm text-gray-500">Comece a vender com atendimento por IA</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <form action={action} className="space-y-4">
            {state?.message && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.message}</div>
            )}

            <Input
              label="Nome do restaurante"
              name="name"
              placeholder="Ex: Pizzaria do João"
              error={state?.errors?.name?.[0]}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="contato@restaurante.com"
              error={state?.errors?.email?.[0]}
              required
            />
            <Input
              label="Telefone / WhatsApp"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              error={state?.errors?.phone?.[0]}
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              error={state?.errors?.password?.[0]}
              required
            />

            <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-700">
              Ao criar sua conta, você concorda com nossos{' '}
              <span className="font-semibold">Termos de Uso</span> e{' '}
              <span className="font-semibold">Política de Privacidade</span>.
            </div>

            <Button type="submit" className="w-full" size="lg" loading={pending}>
              Criar conta grátis
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
