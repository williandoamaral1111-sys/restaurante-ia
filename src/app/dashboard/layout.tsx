import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session || session.role !== 'restaurant') {
    redirect('/login')
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, logo: true, slug: true, active: true },
  })

  if (!restaurant) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar restaurant={restaurant} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader restaurant={restaurant} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
