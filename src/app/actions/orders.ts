'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { broadcastToRestaurant, broadcastToCustomer } from '@/lib/sse'
import { sendOrderToWhatsApp } from '@/lib/whatsapp'

type OrderStatus = 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await getSession()
  if (!session || session.role !== 'restaurant') throw new Error('Unauthorized')

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId: session.id },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      items: true,
    },
  })
  if (!order) throw new Error('Order not found')

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      items: true,
    },
  })

  // Notifica painel do restaurante
  broadcastToRestaurant(session.id, { type: 'update_order', order: updated })

  // Notifica cliente em tempo real
  broadcastToCustomer(order.customerId, {
    type: 'order_status',
    orderId: order.id,
    orderNumber: order.orderNumber,
    status,
  })

  revalidatePath('/dashboard/pedidos')
  revalidatePath('/dashboard')
}

export async function createOrder(data: {
  restaurantId: string
  customerId: string
  addressId: string
  items: { menuItemId: string; quantity: number; notes?: string; addons?: unknown }[]
  paymentMethod: string
  notes?: string
  source?: 'WEB' | 'AI_VOICE' | 'WHATSAPP'
}) {
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: data.items.map((i) => i.menuItemId) },
      restaurantId: data.restaurantId,
    },
  })

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: data.restaurantId },
    select: { deliveryFee: true, name: true, phone: true, whatsappInstance: true, whatsappStatus: true },
  })

  let subtotal = 0
  const orderItems = data.items.map((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId)
    if (!menuItem) throw new Error(`Item ${item.menuItemId} não encontrado`)

    const addonTotal = Array.isArray(item.addons)
      ? (item.addons as { price: number }[]).reduce((s, a) => s + (a.price || 0), 0)
      : 0

    const unitPrice = menuItem.price + addonTotal
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice

    return {
      menuItem: { connect: { id: item.menuItemId } },
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      notes: item.notes || null,
      addons: item.addons ? (item.addons as Prisma.InputJsonValue) : Prisma.JsonNull,
      itemName: menuItem.name,
      itemPrice: menuItem.price,
    }
  })

  const deliveryFee = restaurant?.deliveryFee || 0
  const total = subtotal + deliveryFee

  const lastOrder = await prisma.order.findFirst({
    where: { restaurantId: data.restaurantId },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  })
  const orderNumber = (lastOrder?.orderNumber || 0) + 1

  const order = await prisma.order.create({
    data: {
      orderNumber,
      restaurantId: data.restaurantId,
      customerId: data.customerId,
      addressId: data.addressId,
      paymentMethod: data.paymentMethod as any,
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      notes: data.notes || null,
      source: data.source || 'WEB',
      items: { create: orderItems },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      address: true,
      items: true,
    },
  })

  await prisma.restaurantCustomer.upsert({
    where: { restaurantId_customerId: { restaurantId: data.restaurantId, customerId: data.customerId } },
    create: { restaurantId: data.restaurantId, customerId: data.customerId, totalOrders: 1 },
    update: { totalOrders: { increment: 1 }, lastOrderAt: new Date() },
  })

  // Notifica restaurante via SSE (painel em tempo real)
  broadcastToRestaurant(data.restaurantId, { type: 'new_order', order })

  // Envia cópia do pedido para o WhatsApp próprio do restaurante (se conectado)
  if (restaurant?.whatsappInstance && restaurant?.whatsappStatus === 'connected') {
    sendOrderToWhatsApp({
      orderNumber: order.orderNumber,
      restaurantName: restaurant?.name || '',
      restaurantPhone: restaurant?.phone || null,
      restaurantWhatsappInstance: restaurant.whatsappInstance,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      items: order.items.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      address: order.address
        ? {
            street: order.address.street,
            number: order.address.number,
            complement: order.address.complement ?? null,
            neighborhood: order.address.neighborhood,
            city: order.address.city,
          }
        : null,
      notes: order.notes,
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/pedidos')

  return order
}
