import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Clock, Truck, LogOut, ShoppingBag } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export default async function BuscarPage() {
  const session = await getSession()

  const restaurants = await prisma.restaurant.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      coverImage: true,
      description: true,
      deliveryFee: true,
      estimatedTime: true,
      minOrderValue: true,
      city: true,
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-lg">🍽️</div>
            <span className="font-bold text-gray-900">RestauranteIA</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pedidos"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <ShoppingBag size={14} />
              Meus Pedidos
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <LogOut size={14} />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Restaurantes</h1>
          <p className="mt-1 text-sm text-gray-500">Escolha onde quer pedir</p>
        </div>

        {restaurants.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="text-gray-500">Nenhum restaurante disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/${r.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Cover */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200">
                  {r.coverImage ? (
                    <img
                      src={r.coverImage}
                      alt={r.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">🍔</div>
                  )}
                  {r.logo && (
                    <div className="absolute -bottom-4 left-4 h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-white shadow">
                      <img src={r.logo} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={`p-4 ${r.logo ? 'pt-6' : ''}`}>
                  <h2 className="font-bold text-gray-900 group-hover:text-orange-600">{r.name}</h2>
                  {r.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{r.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {r.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck size={12} />
                      {r.deliveryFee === 0 ? 'Grátis' : formatCurrency(r.deliveryFee)}
                    </span>
                    {r.minOrderValue > 0 && (
                      <span>Mín. {formatCurrency(r.minOrderValue)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
