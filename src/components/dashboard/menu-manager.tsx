'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChefHat, Tag, Search
} from 'lucide-react'
import { createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from '@/app/actions/menu'
import { MenuItemModal } from './menu-item-modal'

interface Category {
  id: string; name: string; description: string | null; sortOrder: number; active: boolean
}

interface AddonOption {
  id: string; name: string; price: number; available: boolean
}

interface AddonGroup {
  id: string; name: string; required: boolean; minSelect: number; maxSelect: number
  options: AddonOption[]
}

interface MenuItem {
  id: string; name: string; description: string | null; price: number
  images: string[]; available: boolean; featured: boolean; sortOrder: number
  categoryId: string | null
  category: { name: string } | null
  addonGroups: AddonGroup[]
}

interface MenuManagerProps {
  restaurantId: string
  initialCategories: Category[]
  initialItems: MenuItem[]
}

export function MenuManager({ restaurantId, initialCategories, initialItems }: MenuManagerProps) {
  const [categories] = useState(initialCategories)
  const [items, setItems] = useState(initialItems)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filteredItems = items.filter((item) => {
    const matchCat = !selectedCategory || item.categoryId === selectedCategory
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  function handleToggleAvailability(item: MenuItem) {
    startTransition(async () => {
      await toggleMenuItemAvailability(item.id, !item.available)
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i))
      )
    })
  }

  function handleDelete(itemId: string) {
    if (!confirm('Excluir este prato?')) return
    startTransition(async () => {
      await deleteMenuItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    })
  }

  function handleEdit(item: MenuItem) {
    setEditingItem(item)
    setShowModal(true)
  }

  function handleNew() {
    setEditingItem(null)
    setShowModal(true)
  }

  async function handleSave(data: Partial<MenuItem>) {
    startTransition(async () => {
      if (editingItem) {
        const updated = await updateMenuItem(editingItem.id, data as any)
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i)))
      } else {
        const created = await createMenuItem({ ...data as any, restaurantId })
        setItems((prev) => [...prev, created as any])
      }
      setShowModal(false)
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="Buscar prato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus size={16} />
          Novo Prato
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            !selectedCategory
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name} ({items.filter((i) => i.categoryId === cat.id).length})
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <ChefHat size={40} className="mb-3 text-gray-300" />
          <p className="text-gray-500">Nenhum prato encontrado</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleNew}>
            Adicionar primeiro prato
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-opacity ${!item.available ? 'opacity-60' : ''}`}
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-100">
                {item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
                )}
                {item.featured && (
                  <span className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    Destaque
                  </span>
                )}
                {!item.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700">
                      Indisponível
                    </span>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <span className="shrink-0 font-bold text-orange-600">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                {item.category && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    <Tag size={10} />
                    {item.category.name}
                  </span>
                )}
                {item.description && (
                  <p className="line-clamp-2 text-xs text-gray-500">{item.description}</p>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    {item.available ? (
                      <><EyeOff size={12} /> Pausar</>
                    ) : (
                      <><Eye size={12} /> Ativar</>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center justify-center rounded-lg border border-red-100 p-1.5 text-red-400 transition hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MenuItemModal
          item={editingItem}
          categories={categories}
          restaurantId={restaurantId}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          isPending={isPending}
        />
      )}
    </div>
  )
}
