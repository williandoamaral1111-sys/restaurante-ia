'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function addAddress(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'customer') throw new Error('Unauthorized')

  const label = (formData.get('label') as string) || 'Casa'
  const street = formData.get('street') as string
  const number = formData.get('number') as string
  const complement = (formData.get('complement') as string) || null
  const neighborhood = formData.get('neighborhood') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const zipCode = formData.get('zipCode') as string

  if (!street || !number || !neighborhood || !city || !state || !zipCode) {
    throw new Error('Campos obrigatórios ausentes')
  }

  const existing = await prisma.address.count({ where: { customerId: session.id } })

  await prisma.address.create({
    data: {
      label,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      isDefault: existing === 0,
      customerId: session.id,
    },
  })

  revalidatePath('/', 'layout')
}
