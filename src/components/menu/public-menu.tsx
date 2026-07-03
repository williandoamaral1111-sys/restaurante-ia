'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { MenuItemCard } from './menu-item-card'
import { Cart } from './cart'
import { CartProvider } from '@/contexts/cart-context'
import { ShoppingCart, Clock, Truck, Star, Mic } from 'lucide-react'
import { VoiceOrderButton } from './voice-order-button'

interface Restaurant {
  id: string; name: string; slug: string; logo: string | null; coverImage: string | null
  description: string | null; deliveryFee: number; estimatedTime: number; minOrderValue: number
  pixKey: string | null
  categories: { id: string; name: string; icon: string | null }[]
  menuItems: MenuItem[]
}

interface MenuItem {
  id: string; name: string; description: string | null; price: number
  images: string[]; featured: boolean; categoryId: string | null
  addonGroups: AddonGroup[]
}

interface AddonGroup {
  id: string; name: string; required: boolean; minSelect: number; maxSelect: number
  options: { id: string; name: string; price: number }[]
}

interface Customer {
  id: string; name: string; phone: string
  addresses: { id: string; label: string; street: string; number: string; neighborhood: string; city: string; isDefault: boolean }[]
}

interface PublicMenuProps {
  restaurant: Restaurant
  customer: Customer | null
  isOpen: boolean
}

export function PublicMenu({ restaurant, customer, isOpen }: PublicMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredItems = activeCategory
    ? restaurant.menuItems.filter((i) => i.categoryId === activeCategory)
    : restaurant.menuItems

  const featuredItems = restaurant.menuItems.filter((i) => i.featured)

  return (
    <CartProvider restaurantId={restaurant.id}>
      <div className="min-h-screen bg-gray-50">
        {/* Header / Cover */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600">
            {restaurant.coverImage && (
              <img
                src={restaurant.coverImage}
                alt={restaurant.name}
                className="h-full w-full object-cover opacity-60"
              />
            )}
          </div>

          <div className="mx-auto max-w-3xl px-4 pb-4 -mt-12">
            <div className="rounded-2xl bg-white p-5 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-3xl">
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name} className="h-full w-full object-cover" />
                  ) : '🍽️'}
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                  {restaurant.description && (
                    <p className="mt-0.5 text-sm text-gray-500">{restaurant.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-orange-500" />
                      {restaurant.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck size={12} className="text-orange-500" />
                      {restaurant.deliveryFee > 0 ? formatCurrency(restaurant.deliveryFee) : 'Frete grátis'}
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                        isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {isOpen ? '● Aberto' : '● Fechado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-32">
          {/* Atendimento por IA */}
          <VoiceOrderButton restaurantId={restaurant.id} restaurantName={restaurant.name} />

          {/* Destaques */}
          {featuredItems.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Star size={16} className="text-orange-500" />
                Destaques
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {featuredItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} compact />
                ))}
              </div>
            </div>
          )}

          {/* Categorias */}
          {restaurant.categories.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  !activeCategory
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              {restaurant.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
                  }`}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <p className="text-4xl mb-2">🍽️</p>
              <p>Nenhum item encontrado</p>
            </div>
          )}
        </div>

        {/* Floating Cart */}
        <Cart customer={customer} restaurant={restaurant} />
      </div>
    </CartProvider>
  )
}
