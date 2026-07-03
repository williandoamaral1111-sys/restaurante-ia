'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function createMenuItem(data: {
  restaurantId: string
  name: string
  description?: string
  price: number
  categoryId?: string | null
  images?: string[]
  available?: boolean
  featured?: boolean
  addonGroups?: {
    name: string; required: boolean; minSelect: number; maxSelect: number
    options: { name: string; price: number }[]
  }[]
}) {
  const session = await getSession()
  if (!session || session.role !== 'restaurant') throw new Error('Unauthorized')

  const item = await prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      categoryId: data.categoryId || null,
      images: data.images || [],
      available: data.available ?? true,
      featured: data.featured ?? false,
      restaurantId: data.restaurantId,
      addonGroups: data.addonGroups
        ? {
            create: data.addonGroups.map((g) => ({
              name: g.name,
              required: g.required,
              minSelect: g.minSelect,
              maxSelect: g.maxSelect,
              options: { create: g.options },
            })),
          }
        : undefined,
    },
    include: { category: { select: { name: true } }, addonGroups: { include: { options: true } } },
  })

  revalidatePath('/dashboard/cardapio')
  return item
}

export async function updateMenuItem(
  itemId: string,
  data: {
    name?: string
    description?: string
    price?: number
    categoryId?: string | null
    images?: string[]
    available?: boolean
    featured?: boolean
    addonGroups?: {
      name: string; required: boolean; minSelect: number; maxSelect: number
      options: { name: string; price: number }[]
    }[]
  }
) {
  const session = await getSession()
  if (!session || session.role !== 'restaurant') throw new Error('Unauthorized')

  // Verificar propriedade
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId: session.id },
  })
  if (!item) throw new Error('Item not found')

  // Deletar addon groups existentes e recriar
  if (data.addonGroups !== undefined) {
    await prisma.addonGroup.deleteMany({ where: { menuItemId: itemId } })
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.images !== undefined && { images: data.images }),
      ...(data.available !== undefined && { available: data.available }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.addonGroups !== undefined && {
        addonGroups: {
          create: data.addonGroups.map((g) => ({
            name: g.name,
            required: g.required,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            options: { create: g.options },
          })),
        },
      }),
    },
    include: { category: { select: { name: true } }, addonGroups: { include: { options: true } } },
  })

  revalidatePath('/dashboard/cardapio')
  return updated
}

export async function deleteMenuItem(itemId: string) {
  const session = await getSession()
  if (!session || session.role !== 'restaurant') throw new Error('Unauthorized')

  await prisma.menuItem.deleteMany({
    where: { id: itemId, restaurantId: session.id },
  })

  revalidatePath('/dashboard/cardapio')
}

export async function toggleMenuItemAvailability(itemId: string, available: boolean) {
  const session = await getSession()
  if (!session || session.role !== 'restaurant') throw new Error('Unauthorized')

  await prisma.menuItem.updateMany({
    where: { id: itemId, restaurantId: session.id },
    data: { available },
  })

  revalidatePath('/dashboard/cardapio')
}

export async function createCategory(name: string, restaurantId: string) {
  const session = await getSession()
  if (!session || session.role !== 'restaurant') throw new Error('Unauthorized')

  const category = await prisma.category.create({
    data: { name, restaurantId },
  })

  revalidatePath('/dashboard/cardapio')
  return category
}
