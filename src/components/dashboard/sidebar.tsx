'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  Settings,
  Mic,
  ChevronRight,
  MessageCircle,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/dashboard/cardapio', label: 'Cardápio', icon: UtensilsCrossed },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/dashboard/ia', label: 'IA de Voz', icon: Mic },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  restaurant: { id: string; name: string; logo: string | null; slug: string }
}

export function DashboardSidebar({ restaurant }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-xl">
          {restaurant.logo ? (
            <img src={restaurant.logo} alt={restaurant.name} className="h-full w-full rounded-lg object-cover" />
          ) : (
            '🍽️'
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{restaurant.name}</p>
          <p className="text-xs text-gray-400">Painel do Restaurante</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-4.5 w-4.5', active ? 'text-orange-500' : 'text-gray-400')} size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="text-orange-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Link cardápio público */}
      <div className="border-t border-gray-100 p-3">
        <a
          href={`/${restaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <span>🔗</span>
          <span>Ver cardápio público</span>
        </a>
      </div>
    </aside>
  )
}
