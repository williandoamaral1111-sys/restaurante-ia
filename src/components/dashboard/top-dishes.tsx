import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface TopItem {
  menuItemId: string
  itemName: string
  _sum: { quantity: number | null; totalPrice: number | null }
}

export function TopDishes({ items }: { items: TopItem[] }) {
  const maxQty = items[0]?._sum.quantity || 1

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp size={16} className="text-orange-500" />
          Top Pratos Hoje
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Nenhum pedido ainda hoje</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const qty = item._sum.quantity || 0
              const pct = (qty / maxQty) * 100

              return (
                <div key={item.menuItemId}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                        {idx + 1}
                      </span>
                      <span className="max-w-[120px] truncate text-sm font-medium text-gray-800">
                        {item.itemName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-gray-900">{qty}x</span>
                      <p className="text-xs text-gray-400">{formatCurrency(item._sum.totalPrice || 0)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-orange-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
