'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function updateRestaurantSettings(data: {
  id: string
  name: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  description?: string
  deliveryFee?: number
  minOrderValue?: number
  estimatedTime?: number
  pixKey?: string
  pixKeyType?: string
  pixMerchantName?: string
  openingHours?: unknown
}) {
  const session = await getSession()
  if (!session || session.role !== 'restaurant' || session.id !== data.id) {
    throw new Error('Unauthorized')
  }

  await prisma.restaurant.update({
    where: { id: data.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      description: data.description || null,
      deliveryFee: data.deliveryFee || 0,
      minOrderValue: data.minOrderValue || 0,
      estimatedTime: data.estimatedTime || 45,
      pixKey: data.pixKey || null,
      pixKeyType: data.pixKeyType || null,
      pixMerchantName: data.pixMerchantName || null,
      openingHours: data.openingHours || undefined,
    },
  })

  revalidatePath('/dashboard/configuracoes')
}
