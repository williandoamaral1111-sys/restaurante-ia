'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/contexts/cart-context'
import { Plus, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddonOption { id: string; name: string; price: number }
interface AddonGroup {
  id: string; name: string; required: boolean; minSelect: number; maxSelect: number
  options: AddonOption[]
}

interface MenuItem {
  id: string; name: string; description: string | null; price: number
  images: string[]; addonGroups: AddonGroup[]
}

interface MenuItemCardProps {
  item: MenuItem
  compact?: boolean
}

export function MenuItemCard({ item, compact = false }: MenuItemCardProps) {
  const { addItem } = useCart()
  const [showModal, setShowModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({})

  function handleAddToCart() {
    if (item.addonGroups.length > 0) {
      setShowModal(true)
      return
    }
    addToCart()
  }

  function addToCart() {
    const addonsList = Object.entries(selectedAddons).flatMap(([groupId, optionIds]) => {
      const group = item.addonGroups.find((g) => g.id === groupId)
      return optionIds.map((optId) => {
        const opt = group?.options.find((o) => o.id === optId)
        return {
          groupId,
          groupName: group?.name || '',
          optionId: optId,
          optionName: opt?.name || '',
          price: opt?.price || 0,
        }
      })
    })

    const addonTotal = addonsList.reduce((s, a) => s + a.price, 0)
    const unitPrice = item.price + addonTotal

    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      notes: notes || undefined,
      addons: addonsList,
      unitPrice,
      totalPrice: unitPrice * quantity,
    })

    setShowModal(false)
    setQuantity(1)
    setNotes('')
    setSelectedAddons({})
  }

  function toggleAddon(groupId: string, optionId: string, maxSelect: number) {
    setSelectedAddons((prev) => {
      const current = prev[groupId] || []
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) }
      }
      if (current.length >= maxSelect) {
        return { ...prev, [groupId]: [...current.slice(1), optionId] }
      }
      return { ...prev, [groupId]: [...current, optionId] }
    })
  }

  const addonTotal = Object.entries(selectedAddons).reduce((sum, [groupId, optionIds]) => {
    const group = item.addonGroups.find((g) => g.id === groupId)
    return (
      sum +
      optionIds.reduce((s, optId) => {
        const opt = group?.options.find((o) => o.id === optId)
        return s + (opt?.price || 0)
      }, 0)
    )
  }, 0)

  if (compact) {
    return (
      <div
        className="flex w-40 shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
        onClick={handleAddToCart}
      >
        <div className="h-24 bg-gray-100">
          {item.images[0] ? (
            <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.name}</p>
          <p className="text-xs font-bold text-orange-600">{formatCurrency(item.price)}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{item.description}</p>
          )}
          <p className="mt-2 font-bold text-orange-600">{formatCurrency(item.price)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {item.images[0] && (
            <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100">
              <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
            </div>
          )}
          <button
            onClick={handleAddToCart}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow transition-transform hover:bg-orange-600 active:scale-95"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Addon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
            {/* Header */}
            <div className="relative h-40 bg-gray-100">
              {item.images[0] && (
                <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
              )}
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
              {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
              <p className="mt-1 font-bold text-orange-600">{formatCurrency(item.price)}</p>

              {/* Addon Groups */}
              {item.addonGroups.map((group) => (
                <div key={group.id} className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">{group.name}</h4>
                    {group.required && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const selected = selectedAddons[group.id]?.includes(option.id)
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleAddon(group.id, option.id, group.maxSelect)}
                          className={`flex w-full items-center justify-between rounded-lg border p-3 text-sm transition-colors ${
                            selected
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                selected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                              }`}
                            >
                              {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                            </span>
                            {option.name}
                          </span>
                          {option.price > 0 && (
                            <span className="font-semibold">+{formatCurrency(option.price)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Observações */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4">
              <div className="mb-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-lg font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  <Plus size={16} />
                </button>
              </div>
              <Button className="w-full" size="lg" onClick={addToCart}>
                Adicionar {quantity}x — {formatCurrency((item.price + addonTotal) * quantity)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
