import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { PublicMenu } from '@/components/menu/public-menu'

interface Props {
  params: Promise<{ restaurantSlug: string }>
}

export default async function RestaurantMenuPage({ params }: Props) {
  const { restaurantSlug } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug, active: true },
    include: {
      categories: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      },
      menuItems: {
        where: { available: true },
        include: { addonGroups: { include: { options: { where: { available: true } } } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!restaurant) notFound()

  const session = await getSession()
  const customer =
    session?.role === 'customer'
      ? await prisma.customer.findUnique({
          where: { id: session.id },
          include: {
            addresses: { orderBy: { isDefault: 'desc' } },
          },
        })
      : null

  const isOpen = checkIfOpen(restaurant.openingHours as any)

  return (
    <PublicMenu
      restaurant={restaurant}
      customer={customer}
      isOpen={isOpen}
    />
  )
}

function checkIfOpen(hours: Record<string, { open?: string; close?: string; enabled?: boolean; closed?: boolean }> | null): boolean {
  if (!hours) return true

  const now = new Date()
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayKey = days[now.getDay()]
  const dayHours = hours[dayKey]

  if (!dayHours) return false
  if (dayHours.closed === true || dayHours.enabled === false) return false
  if (!dayHours.open || !dayHours.close) return false

  const [openH, openM] = dayHours.open.split(':').map(Number)
  const [closeH, closeM] = dayHours.close.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}
