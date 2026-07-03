import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsForm } from '@/components/dashboard/settings-form'

export default async function ConfiguracoesPage() {
  const session = await getSession()
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session!.id },
  })

  if (!restaurant) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      <SettingsForm restaurant={restaurant} />
    </div>
  )
}
