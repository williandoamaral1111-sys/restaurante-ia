'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Trash2 } from 'lucide-react'

interface Category { id: string; name: string }

interface AddonOption { name: string; price: number }
interface AddonGroup { name: string; required: boolean; minSelect: number; maxSelect: number; options: AddonOption[] }

interface MenuItemModalProps {
  item: any | null
  categories: Category[]
  restaurantId: string
  onSave: (data: any) => void
  onClose: () => void
  isPending: boolean
}

export function MenuItemModal({ item, categories, onSave, onClose, isPending }: MenuItemModalProps) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    categoryId: item?.categoryId || '',
    available: item?.available ?? true,
    featured: item?.featured ?? false,
    images: item?.images || [] as string[],
  })

  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>(
    item?.addonGroups?.map((g: any) => ({
      name: g.name,
      required: g.required,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: g.options.map((o: any) => ({ name: o.name, price: o.price })),
    })) || []
  )

  const [imageUrl, setImageUrl] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...form,
      price: parseFloat(form.price),
      categoryId: form.categoryId || null,
      addonGroups,
    })
  }

  function addGroup() {
    setAddonGroups([...addonGroups, { name: '', required: false, minSelect: 0, maxSelect: 1, options: [] }])
  }

  function removeGroup(i: number) {
    setAddonGroups(addonGroups.filter((_, idx) => idx !== i))
  }

  function updateGroup(i: number, key: string, value: any) {
    setAddonGroups(addonGroups.map((g, idx) => (idx === i ? { ...g, [key]: value } : g)))
  }

  function addOption(groupIdx: number) {
    const groups = [...addonGroups]
    groups[groupIdx].options.push({ name: '', price: 0 })
    setAddonGroups(groups)
  }

  function updateOption(groupIdx: number, optIdx: number, key: string, value: any) {
    const groups = [...addonGroups]
    groups[groupIdx].options[optIdx] = { ...groups[groupIdx].options[optIdx], [key]: value }
    setAddonGroups(groups)
  }

  function removeOption(groupIdx: number, optIdx: number) {
    const groups = [...addonGroups]
    groups[groupIdx].options.splice(optIdx, 1)
    setAddonGroups(groups)
  }

  function addImage() {
    if (imageUrl.trim()) {
      setForm({ ...form, images: [...form.images, imageUrl.trim()] })
      setImageUrl('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {item ? 'Editar Prato' : 'Novo Prato'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Nome do prato *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Pizza Margherita"
                  required
                />
              </div>
              <div>
                <Input
                  label="Preço *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="29.90"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva o prato..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-4">
              {[
                { key: 'available', label: 'Disponível' },
                { key: 'featured', label: 'Destaque' },
              ].map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Imagens */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Fotos</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL da imagem..."
                  className="h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                />
                <Button type="button" variant="outline" size="sm" onClick={addImage}>
                  <Plus size={14} />
                </Button>
              </div>
              {form.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.images.map((img: string, i: number) => (
                    <div key={i} className="group relative">
                      <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, images: form.images.filter((_: string, idx: number) => idx !== i) })}
                        className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adicionais */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Grupos de Adicionais</p>
                <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                  <Plus size={14} /> Grupo
                </Button>
              </div>
              <div className="space-y-3">
                {addonGroups.map((group, gi) => (
                  <div key={gi} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        className="h-8 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                        placeholder="Nome do grupo (ex: Tamanho, Sabor...)"
                        value={group.name}
                        onChange={(e) => updateGroup(gi, 'name', e.target.value)}
                      />
                      <button type="button" onClick={() => removeGroup(gi)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mb-2 flex gap-4 text-xs text-gray-500">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={group.required}
                          onChange={(e) => updateGroup(gi, 'required', e.target.checked)} />
                        Obrigatório
                      </label>
                    </div>
                    <div className="space-y-2">
                      {group.options.map((opt, oi) => (
                        <div key={oi} className="flex gap-2">
                          <input
                            className="h-8 flex-1 rounded border border-gray-200 px-2 text-sm"
                            placeholder="Opção (ex: Grande)"
                            value={opt.name}
                            onChange={(e) => updateOption(gi, oi, 'name', e.target.value)}
                          />
                          <input
                            className="h-8 w-24 rounded border border-gray-200 px-2 text-sm"
                            type="number" step="0.01" min="0"
                            placeholder="+R$"
                            value={opt.price}
                            onChange={(e) => updateOption(gi, oi, 'price', parseFloat(e.target.value) || 0)}
                          />
                          <button type="button" onClick={() => removeOption(gi, oi)} className="text-red-400">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => addOption(gi)} className="text-xs">
                        <Plus size={12} /> Adicionar opção
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={isPending}>
              {item ? 'Salvar Alterações' : 'Criar Prato'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
