import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MenuManager } from '@/components/dashboard/menu-manager'

export const dynamic = 'force-dynamic'

export default async function CardapioPage() {
  const session = await getSession()
  const restaurantId = session!.id

  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        category: { select: { name: true } },
        addonGroups: { include: { options: true } },
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
      <MenuManager
        restaurantId={restaurantId}
        initialCategories={categories}
        initialItems={menuItems}
      />
    </div>
  )
}
