'use client'

import { useEffect, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from '@/lib/utils'
import { updateOrderStatus } from '@/app/actions/orders'
import { Phone, MapPin, Clock, ChevronRight } from 'lucide-react'

type OrderStatus = 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  RECEIVED: 'PREPARING',
  PREPARING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: 'Recebido',
  PREPARING: 'Em Preparo',
  OUT_FOR_DELIVERY: 'Saiu p/ Entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANTS: Record<OrderStatus, string> = {
  RECEIVED: 'default',
  PREPARING: 'warning',
  OUT_FOR_DELIVERY: 'blue',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
}

const COLUMNS: OrderStatus[] = ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY']

interface Order {
  id: string
  orderNumber: number
  status: OrderStatus
  total: number
  deliveryFee: number
  subtotal: number
  paymentMethod: string
  paymentStatus: string
  notes: string | null
  createdAt: Date | string
  estimatedTime: number | null
  customer: { name: string; phone: string }
  address: {
    street: string; number: string; neighborhood: string; city: string; complement?: string | null
  } | null
  items: {
    id: string; quantity: number; itemName: string; unitPrice: number; totalPrice: number
    addons: unknown; notes: string | null
  }[]
}

interface OrdersBoardProps {
  initialOrders: Order[]
  restaurantId: string
}

export function OrdersBoard({ initialOrders, restaurantId }: OrdersBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [isPending, startTransition] = useTransition()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // SSE para atualizações em tempo real
  useEffect(() => {
    const es = new EventSource(`/api/orders/stream?restaurantId=${restaurantId}`)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_order') {
          setOrders((prev) => [data.order, ...prev])
        } else if (data.type === 'update_order') {
          setOrders((prev) =>
            prev.map((o) => (o.id === data.order.id ? data.order : o))
              .filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
          )
        }
      } catch {}
    }
    return () => es.close()
  }, [restaurantId])

  function handleAdvanceStatus(order: Order) {
    const next = STATUS_FLOW[order.status]
    if (!next) return

    startTransition(async () => {
      await updateOrderStatus(order.id, next)
      setOrders((prev) =>
        prev
          .map((o) => (o.id === order.id ? { ...o, status: next } : o))
          .filter((o) => o.status !== 'DELIVERED')
      )
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((s) => (s ? { ...s, status: next } : s))
      }
    })
  }

  function handleCancel(order: Order) {
    startTransition(async () => {
      await updateOrderStatus(order.id, 'CANCELLED')
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      if (selectedOrder?.id === order.id) setSelectedOrder(null)
    })
  }

  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Kanban columns */}
      {COLUMNS.map((col) => {
        const colOrders = byStatus(col)
        return (
          <div key={col} className="flex w-80 shrink-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">{STATUS_LABELS[col]}</h2>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-bold text-gray-600">
                {colOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {colOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-orange-500">#{order.orderNumber}</span>
                        <p className="text-sm font-semibold text-gray-900">{order.customer.name}</p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[order.status] as any}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </div>

                    <div className="mb-2 space-y-0.5">
                      {order.items.slice(0, 3).map((item) => (
                        <p key={item.id} className="text-xs text-gray-500">
                          {item.quantity}x {item.itemName}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-gray-400">+{order.items.length - 3} item(s)</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                      <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
                    </div>

                    <div className="mt-2 flex gap-2">
                      {STATUS_FLOW[order.status] && (
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(order) }}
                          loading={isPending}
                        >
                          {STATUS_LABELS[STATUS_FLOW[order.status]!]} →
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-500 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); handleCancel(order) }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {colOrders.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                  <p className="text-sm text-gray-400">Nenhum pedido</p>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Order Detail Sidebar */}
      {selectedOrder && (
        <div className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900">
              Pedido #{selectedOrder.orderNumber}
            </h3>
            <button
              onClick={() => setSelectedOrder(null)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Cliente */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Cliente</p>
              <p className="font-medium text-gray-900">{selectedOrder.customer.name}</p>
              <a
                href={`tel:${selectedOrder.customer.phone}`}
                className="flex items-center gap-1 text-sm text-orange-500"
              >
                <Phone size={12} />
                {selectedOrder.customer.phone}
              </a>
            </div>

            {/* Endereço */}
            {selectedOrder.address && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Endereço</p>
                <p className="flex items-start gap-1 text-sm text-gray-700">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-gray-400" />
                  {selectedOrder.address.street}, {selectedOrder.address.number}
                  {selectedOrder.address.complement && `, ${selectedOrder.address.complement}`}
                  {' — '}{selectedOrder.address.neighborhood}, {selectedOrder.address.city}
                </p>
              </div>
            )}

            {/* Itens */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Itens</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {item.quantity}x {item.itemName}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-0.5 text-xs text-gray-500">Obs: {item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo financeiro */}
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Entrega</span>
                  <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-1 text-sm font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Pagamento: {getPaymentMethodLabel(selectedOrder.paymentMethod)}
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Observações</p>
                <p className="rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800">{selectedOrder.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 p-4 space-y-2">
            {STATUS_FLOW[selectedOrder.status] && (
              <Button
                className="w-full"
                onClick={() => handleAdvanceStatus(selectedOrder)}
                loading={isPending}
              >
                Avançar para: {STATUS_LABELS[STATUS_FLOW[selectedOrder.status]!]}
                <ChevronRight size={16} />
              </Button>
            )}
            {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
              <Button
                variant="outline"
                className="w-full text-red-500 hover:text-red-600"
                onClick={() => handleCancel(selectedOrder)}
              >
                Cancelar Pedido
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
