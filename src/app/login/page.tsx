'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loginRestaurant, loginCustomer } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const [tab, setTab] = useState<'restaurant' | 'customer'>('customer')

  const [restaurantState, restaurantAction, restaurantPending] = useActionState(loginRestaurant, undefined)
  const [customerState, customerAction, customerPending] = useActionState(loginCustomer, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl shadow-lg">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">RestauranteIA</h1>
          <p className="mt-1 text-sm text-gray-500">Faça login para continuar</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('customer')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'customer'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sou Cliente
            </button>
            <button
              onClick={() => setTab('restaurant')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'restaurant'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sou Restaurante
            </button>
          </div>

          <div className="p-6">
            {/* Customer Login */}
            {tab === 'customer' && (
              <form action={customerAction} className="space-y-4">
                <input type="hidden" name="redirect" value={redirect} />
                {customerState?.message && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {customerState.message}
                  </div>
                )}
                <Input
                  label="Celular"
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  error={customerState?.errors?.phone?.[0]}
                  required
                />
                <Input
                  label="Senha"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  error={customerState?.errors?.password?.[0]}
                  required
                />
                <Button type="submit" className="w-full" size="lg" loading={customerPending}>
                  Entrar
                </Button>
                <p className="text-center text-sm text-gray-500">
                  Não tem conta?{' '}
                  <Link href="/cadastro" className="font-semibold text-orange-500 hover:text-orange-600">
                    Cadastre-se
                  </Link>
                </p>
              </form>
            )}

            {/* Restaurant Login */}
            {tab === 'restaurant' && (
              <form action={restaurantAction} className="space-y-4">
                {restaurantState?.message && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {restaurantState.message}
                  </div>
                )}
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="seu@restaurante.com"
                  error={restaurantState?.errors?.email?.[0]}
                  required
                />
                <Input
                  label="Senha"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  error={restaurantState?.errors?.password?.[0]}
                  required
                />
                <Button type="submit" className="w-full" size="lg" loading={restaurantPending}>
                  Entrar no Painel
                </Button>
                <p className="text-center text-sm text-gray-500">
                  Não tem conta?{' '}
                  <Link
                    href="/cadastro-restaurante"
                    className="font-semibold text-orange-500 hover:text-orange-600"
                  >
                    Cadastre seu restaurante
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
