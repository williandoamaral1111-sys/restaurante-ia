'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, X, Plus, Minus, Trash2, MapPin, CreditCard, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createOrder } from '@/app/actions/orders'
import { addAddress } from '@/app/actions/address'

interface Customer {
  id: string; name: string
  addresses: { id: string; label: string; street: string; number: string; neighborhood: string; city: string; isDefault: boolean }[]
}

interface Restaurant {
  id: string; name: string; deliveryFee: number; minOrderValue: number; estimatedTime: number
  pixKey: string | null
}

interface CartProps {
  customer: Customer | null
  restaurant: Restaurant
}

const PAYMENT_METHODS = [
  { value: 'PIX', label: '💸 Pix' },
  { value: 'CREDIT_CARD', label: '💳 Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: '💳 Cartão de Débito' },
  { value: 'CASH', label: '💵 Dinheiro' },
]

export function Cart({ customer, restaurant }: CartProps) {
  const router = useRouter()
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [selectedAddress, setSelectedAddress] = useState(
    customer?.addresses.find((a) => a.isDefault)?.id || customer?.addresses[0]?.id || ''
  )
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState<number | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressPending, startAddressTransition] = useTransition()
  const [addresses, setAddresses] = useState(customer?.addresses || [])

  const total = subtotal + restaurant.deliveryFee
  const canOrder = subtotal >= restaurant.minOrderValue

  async function handlePlaceOrder() {
    if (!customer) {
      router.push(`/login?redirect=/${restaurant.id}`)
      return
    }
    if (!selectedAddress) return alert('Selecione um endereço de entrega')

    setLoading(true)
    try {
      const order = await createOrder({
        restaurantId: restaurant.id,
        customerId: customer.id,
        addressId: selectedAddress,
        paymentMethod,
        notes,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes,
          addons: i.addons,
        })),
      })
      clearCart()
      setOrderPlaced(order.orderNumber)
      setStep('cart')
    } finally {
      setLoading(false)
    }
  }

  if (itemCount === 0 && !orderPlaced) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600"
      >
        <ShoppingCart size={22} />
      </button>
    )
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-3 rounded-full bg-orange-500 px-5 py-3.5 text-white shadow-lg transition hover:bg-orange-600"
      >
        <ShoppingCart size={18} />
        <span className="font-semibold">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
        <span className="font-bold">{formatCurrency(total)}</span>
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-gray-900">
                {step === 'cart' ? 'Seu Pedido' : 'Finalizar Pedido'}
              </h2>
              <button onClick={() => { setOpen(false); setStep('cart') }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Order placed success */}
            {orderPlaced && (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                  ✅
                </div>
                <h3 className="text-lg font-bold text-gray-900">Pedido #{orderPlaced} realizado!</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Seu pedido foi enviado para o restaurante. Tempo estimado: {restaurant.estimatedTime} min.
                </p>
                <Button className="mt-4 w-full" onClick={() => { router.push('/pedidos'); setOrderPlaced(null); setOpen(false) }}>
                  🛵 Acompanhar em tempo real
                </Button>
                <button
                  onClick={() => { setOrderPlaced(null); setOpen(false) }}
                  className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600"
                >
                  Continuar comprando
                </button>
              </div>
            )}

            {!orderPlaced && (
              <div className="max-h-[70vh] overflow-y-auto">
                {step === 'cart' && (
                  <div className="p-5">
                    {/* Items */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.addons.length > 0 && (
                              <p className="text-xs text-gray-400">
                                {item.addons.map((a) => a.optionName).join(', ')}
                              </p>
                            )}
                            <p className="text-sm font-bold text-orange-600">{formatCurrency(item.unitPrice)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white"
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-1 text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Taxa de entrega</span>
                        <span>{restaurant.deliveryFee > 0 ? formatCurrency(restaurant.deliveryFee) : 'Grátis'}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-gray-900">
                        <span>Total</span><span className="text-orange-600">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    {!canOrder && (
                      <p className="mt-2 text-xs text-red-500 text-center">
                        Pedido mínimo: {formatCurrency(restaurant.minOrderValue)}
                      </p>
                    )}

                    <Button
                      className="mt-4 w-full"
                      size="lg"
                      disabled={!canOrder}
                      onClick={() => customer ? setStep('checkout') : router.push('/login')}
                    >
                      {customer ? 'Ir para checkout' : 'Fazer login para pedir'}
                    </Button>
                  </div>
                )}

                {step === 'checkout' && (
                  <div className="p-5 space-y-4">
                    {/* Endereço */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                          <MapPin size={14} className="text-orange-500" />
                          Endereço de entrega
                        </p>
                        <button
                          onClick={() => setShowAddressForm(!showAddressForm)}
                          className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                        >
                          <PlusCircle size={13} />
                          Novo endereço
                        </button>
                      </div>

                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`mb-2 flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition ${
                            selectedAddress === addr.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span
                            className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                              selectedAddress === addr.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                            }`}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{addr.label}</p>
                            <p className="text-xs text-gray-500">
                              {addr.street}, {addr.number} — {addr.neighborhood}, {addr.city}
                            </p>
                          </div>
                        </button>
                      ))}

                      {addresses.length === 0 && !showAddressForm && (
                        <p className="mb-2 text-sm text-gray-400">
                          Nenhum endereço cadastrado.{' '}
                          <button onClick={() => setShowAddressForm(true)} className="font-medium text-orange-500 underline">
                            Adicionar agora
                          </button>
                        </p>
                      )}

                      {showAddressForm && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget)
                            const form = e.currentTarget
                            startAddressTransition(async () => {
                              await addAddress(fd)
                              // optimistic: add to local state
                              const newAddr = {
                                id: Date.now().toString(),
                                label: (fd.get('label') as string) || 'Casa',
                                street: fd.get('street') as string,
                                number: fd.get('number') as string,
                                neighborhood: fd.get('neighborhood') as string,
                                city: fd.get('city') as string,
                                isDefault: addresses.length === 0,
                              }
                              setAddresses((prev) => {
                                const updated = [...prev, newAddr]
                                if (prev.length === 0) setSelectedAddress(newAddr.id)
                                return updated
                              })
                              setShowAddressForm(false)
                              form.reset()
                            })
                          }}
                          className="mt-2 space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-3"
                        >
                          <p className="text-xs font-semibold text-orange-700">Novo endereço</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <input name="street" required placeholder="Rua / Av." className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
                            </div>
                            <input name="number" required placeholder="Nº" className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
                          </div>
                          <input name="complement" placeholder="Complemento (opcional)" className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
                          <input name="neighborhood" required placeholder="Bairro" className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
                          <div className="grid grid-cols-2 gap-2">
                            <input name="city" required placeholder="Cidade" className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
                            <input name="state" required placeholder="UF" maxLength={2} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input name="zipCode" required placeholder="CEP" className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none" />
                            <select name="label" className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none">
                              <option value="Casa">Casa</option>
                              <option value="Trabalho">Trabalho</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowAddressForm(false)} className="flex-1 rounded border border-gray-300 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                              Cancelar
                            </button>
                            <button type="submit" disabled={addressPending} className="flex-1 rounded bg-orange-500 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                              {addressPending ? 'Salvando...' : 'Salvar endereço'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Pagamento */}
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <CreditCard size={14} className="text-orange-500" />
                        Forma de pagamento
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.filter((m) => m.value !== 'PIX' || restaurant.pixKey).map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setPaymentMethod(m.value)}
                            className={`rounded-lg border p-2.5 text-xs font-medium transition ${
                              paymentMethod === m.value
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Observações gerais
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: toque o interfone 201..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Total */}
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>Total a pagar</span>
                        <span className="text-orange-600">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep('cart')}>
                        Voltar
                      </Button>
                      <Button className="flex-1" size="lg" loading={loading} onClick={handlePlaceOrder}>
                        Confirmar Pedido
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
