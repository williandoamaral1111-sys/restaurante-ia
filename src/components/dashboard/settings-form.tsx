'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateRestaurantSettings } from '@/app/actions/restaurant'
import { Clock, CreditCard, Truck, Store } from 'lucide-react'

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]

const PIX_KEY_TYPES = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'RANDOM', label: 'Chave Aleatória' },
]

interface Restaurant {
  id: string; name: string; email: string; phone: string | null; logo: string | null
  address: string | null; city: string | null; state: string | null; zipCode: string | null
  description: string | null; deliveryFee: number; deliveryRadius: number | null
  minOrderValue: number; estimatedTime: number
  openingHours: unknown; pixKey: string | null; pixKeyType: string | null
  pixMerchantName: string | null
}

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const defaultHours = DAYS.reduce<Record<string, { open: string; close: string; closed: boolean }>>(
    (acc, d) => ({
      ...acc,
      [d.key]: { open: '08:00', close: '22:00', closed: false },
    }),
    {}
  )

  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    (restaurant.openingHours as any) || defaultHours
  )

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries())

    startTransition(async () => {
      await updateRestaurantSettings({
        id: restaurant.id,
        name: data.name as string,
        phone: data.phone as string,
        address: data.address as string,
        city: data.city as string,
        state: data.state as string,
        zipCode: data.zipCode as string,
        description: data.description as string,
        deliveryFee: parseFloat(data.deliveryFee as string) || 0,
        minOrderValue: parseFloat(data.minOrderValue as string) || 0,
        estimatedTime: parseInt(data.estimatedTime as string) || 45,
        pixKey: data.pixKey as string,
        pixKeyType: data.pixKeyType as string,
        pixMerchantName: data.pixMerchantName as string,
        openingHours: hours,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {saved && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 font-medium">
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      {/* Dados do Restaurante */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store size={16} className="text-orange-500" />
            Dados do Restaurante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome" name="name" defaultValue={restaurant.name} required />
            <Input label="Telefone / WhatsApp" name="phone" type="tel" defaultValue={restaurant.phone || ''} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              name="description"
              defaultValue={restaurant.description || ''}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="Descreva seu restaurante..."
            />
          </div>
          <Input label="Endereço" name="address" defaultValue={restaurant.address || ''} />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input label="Cidade" name="city" defaultValue={restaurant.city || ''} />
            </div>
            <Input label="Estado" name="state" defaultValue={restaurant.state || ''} />
          </div>
          <Input label="CEP" name="zipCode" defaultValue={restaurant.zipCode || ''} />
        </CardContent>
      </Card>

      {/* Entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck size={16} className="text-orange-500" />
            Configurações de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Input
            label="Taxa de Entrega (R$)"
            name="deliveryFee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={restaurant.deliveryFee}
          />
          <Input
            label="Pedido Mínimo (R$)"
            name="minOrderValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={restaurant.minOrderValue}
          />
          <Input
            label="Tempo Estimado (min)"
            name="estimatedTime"
            type="number"
            min="1"
            defaultValue={restaurant.estimatedTime}
          />
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock size={16} className="text-orange-500" />
            Horários de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day.key} className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-gray-700">{day.label}</span>
                <label className="flex items-center gap-1.5 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={!hours[day.key]?.closed}
                    onChange={(e) =>
                      setHours({ ...hours, [day.key]: { ...hours[day.key], closed: !e.target.checked } })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-orange-500"
                  />
                  Aberto
                </label>
                {!hours[day.key]?.closed && (
                  <>
                    <input
                      type="time"
                      value={hours[day.key]?.open || '08:00'}
                      onChange={(e) =>
                        setHours({ ...hours, [day.key]: { ...hours[day.key], open: e.target.value } })
                      }
                      className="h-8 rounded-lg border border-gray-300 px-2 text-sm focus:border-orange-500 focus:outline-none"
                    />
                    <span className="text-gray-400">até</span>
                    <input
                      type="time"
                      value={hours[day.key]?.close || '22:00'}
                      onChange={(e) =>
                        setHours({ ...hours, [day.key]: { ...hours[day.key], close: e.target.value } })
                      }
                      className="h-8 rounded-lg border border-gray-300 px-2 text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </>
                )}
                {hours[day.key]?.closed && (
                  <span className="text-xs text-gray-400">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard size={16} className="text-orange-500" />
            Chave Pix para Recebimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Chave</label>
              <select
                name="pixKeyType"
                defaultValue={restaurant.pixKeyType || ''}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="">Selecione...</option>
                {PIX_KEY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <Input label="Chave Pix" name="pixKey" defaultValue={restaurant.pixKey || ''} placeholder="Sua chave Pix" />
          </div>
          <Input
            label="Nome do Favorecido (conforme conta)"
            name="pixMerchantName"
            defaultValue={restaurant.pixMerchantName || ''}
            placeholder="Nome para o QR Code Pix"
          />
        </CardContent>
      </Card>

      <Button type="submit" size="lg" loading={isPending}>
        Salvar Configurações
      </Button>
    </form>
  )
}
