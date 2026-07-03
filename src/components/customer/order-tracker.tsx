'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils'
import { MapPin, Phone, ChevronLeft } from 'lucide-react'

type OrderStatus = 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

const STEPS: { status: OrderStatus; label: string; icon: string; desc: string }[] = [
  { status: 'RECEIVED',         label: 'Pedido recebido',     icon: '🔔', desc: 'O restaurante recebeu seu pedido' },
  { status: 'PREPARING',        label: 'Em preparo',          icon: '👨‍🍳', desc: 'Seu pedido está sendo preparado' },
  { status: 'OUT_FOR_DELIVERY', label: 'Saiu para entrega',   icon: '🛵', desc: 'O entregador está a caminho' },
  { status: 'DELIVERED',        label: 'Entregue',            icon: '✅', desc: 'Pedido entregue! Bom apetite!' },
]

const STATUS_ORDER: Record<OrderStatus, number> = {
  RECEIVED: 0, PREPARING: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 3, CANCELLED: -1,
}

interface Order {
  id: string
  orderNumber: number
  status: OrderStatus
  total: number
  subtotal: number
  deliveryFee: number
  paymentMethod: string
  createdAt: string | Date
  notes: string | null
  restaurant: { name: string; slug: string; logo: string | null; phone: string | null; estimatedTime: number }
  items: { id: string; itemName: string; quantity: number; unitPrice: number; totalPrice: number; notes: string | null }[]
  address: { street: string; number: string; complement: string | null; neighborhood: string; city: string } | null
}

interface Props {
  order: Order
  customerId: string
}

export function OrderTracker({ order, customerId }: Props) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (status === 'DELIVERED' || status === 'CANCELLED') return

    const es = new EventSource(`/api/orders/customer-stream?customerId=${customerId}`)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'order_status' && data.orderId === order.id) {
          setStatus(data.status)
          setPulse(true)
          setTimeout(() => setPulse(false), 1000)
        }
      } catch {}
    }
    return () => es.close()
  }, [customerId, order.id, status])

  const currentStep = STATUS_ORDER[status]
  const isCancelled = status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/pedidos" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-bold text-gray-900">Pedido #{order.orderNumber}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

        {/* Status Card */}
        <div className={`rounded-2xl p-5 text-center transition-all ${
          isCancelled ? 'bg-red-50' : 'bg-white border border-gray-100 shadow-sm'
        } ${pulse ? 'scale-[1.02]' : ''}`}>
          {isCancelled ? (
            <>
              <p className="text-4xl mb-2">❌</p>
              <p className="text-lg font-bold text-red-600">Pedido Cancelado</p>
              <p className="text-sm text-red-400 mt-1">Entre em contato com o restaurante se tiver dúvidas</p>
            </>
          ) : (
            <>
              <p className={`text-5xl mb-3 transition-transform ${pulse ? 'scale-125' : ''}`}>
                {STEPS[currentStep]?.icon}
              </p>
              <p className="text-xl font-bold text-gray-900">{STEPS[currentStep]?.label}</p>
              <p className="mt-1 text-sm text-gray-500">{STEPS[currentStep]?.desc}</p>
              {status !== 'DELIVERED' && (
                <p className="mt-2 text-xs text-orange-500 font-medium">
                  Tempo estimado: ~{order.restaurant.estimatedTime} min
                </p>
              )}
            </>
          )}
        </div>

        {/* Progress bar (steps) */}
        {!isCancelled && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="relative">
              {/* Linha de fundo */}
              <div className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-0.5 bg-gray-100" />
              {/* Linha de progresso */}
              <div
                className="absolute left-5 top-5 w-0.5 bg-orange-400 transition-all duration-700"
                style={{ height: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
              />

              <div className="space-y-6">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep
                  const active = i === currentStep
                  return (
                    <div key={step.status} className="relative flex items-start gap-4 pl-2">
                      <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs transition-all ${
                        done
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-gray-200 bg-white text-gray-300'
                      } ${active ? 'ring-4 ring-orange-100' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-300'}`}>
                          {step.icon} {step.label}
                        </p>
                        {active && (
                          <p className="text-xs text-orange-500">{step.desc}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Restaurante */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Restaurante</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl">
              {order.restaurant.logo
                ? <img src={order.restaurant.logo} className="h-full w-full rounded-xl object-cover" alt="" />
                : '🍔'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{order.restaurant.name}</p>
            </div>
            {order.restaurant.phone && (
              <a
                href={`tel:${order.restaurant.phone}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100"
              >
                <Phone size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Endereço */}
        {order.address && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Endereço de entrega</p>
            <p className="flex items-start gap-1.5 text-sm text-gray-700">
              <MapPin size={14} className="mt-0.5 shrink-0 text-orange-400" />
              {order.address.street}, {order.address.number}
              {order.address.complement && `, ${order.address.complement}`}
              {' — '}{order.address.neighborhood}, {order.address.city}
            </p>
          </div>
        )}

        {/* Itens */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Itens do pedido</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.quantity}x {item.itemName}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Entrega</span>
              <span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : 'Grátis'}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Pagamento: {getPaymentMethodLabel(order.paymentMethod)} · {formatDate(order.createdAt)}
          </div>
          {order.notes && (
            <div className="mt-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
              Obs: {order.notes}
            </div>
          )}
        </div>

        <Link
          href={`/${order.restaurant.slug}`}
          className="block rounded-2xl border border-orange-200 bg-orange-50 p-4 text-center text-sm font-semibold text-orange-600 hover:bg-orange-100"
        >
          🍔 Pedir novamente no {order.restaurant.name}
        </Link>
      </div>
    </div>
  )
}
