'use client'

import { logout } from '@/app/actions/auth'
import { Bell, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  restaurant: { name: string; logo: string | null }
}

export function DashboardHeader({ restaurant }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Bem-vindo de volta,</span>
        <span className="text-sm font-semibold text-gray-900">{restaurant.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
        </button>

        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit" className="gap-1.5 text-gray-500">
            <LogOut size={15} />
            Sair
          </Button>
        </form>
      </div>
    </header>
  )
}
