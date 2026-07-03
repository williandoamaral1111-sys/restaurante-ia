import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MessageSquare, TrendingUp, Settings2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function IAPage() {
  const session = await getSession()
  const restaurantId = session!.id

  const [voiceOrders, totalOrders] = await Promise.all([
    prisma.order.count({
      where: { restaurantId, source: 'AI_VOICE' },
    }),
    prisma.order.count({ where: { restaurantId } }),
  ])

  const voicePercent = totalOrders > 0 ? ((voiceOrders / totalOrders) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IA de Atendimento por Voz</h1>
        <p className="text-sm text-gray-500">Configure e monitore o atendimento automatizado</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pedidos via IA', value: String(voiceOrders), icon: Mic, color: 'bg-purple-50 text-purple-600' },
          { label: '% de Pedidos por Voz', value: `${voicePercent}%`, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
          { label: 'Status da IA', value: 'Ativa', icon: MessageSquare, color: 'bg-green-50 text-green-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Como funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona o atendimento por IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Cliente fala',
                desc: 'O cliente pressiona o botão de voz no cardápio digital e fala o pedido.',
                icon: '🎙️',
              },
              {
                step: '2',
                title: 'IA processa',
                desc: 'A IA transcreve o áudio com Whisper, entende a intenção com GPT-4 e responde em voz (TTS).',
                icon: '🤖',
              },
              {
                step: '3',
                title: 'Pedido enviado',
                desc: 'Após confirmar, o pedido é enviado automaticamente para o painel do restaurante.',
                icon: '📋',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl bg-gray-50 p-4">
                <div className="mb-2 text-3xl">{item.icon}</div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 size={16} className="text-orange-500" />
            Configurações da IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Atendimento por Voz</p>
                <p className="text-sm text-gray-500">Exibe o botão de voz no cardápio digital</p>
              </div>
              <Badge variant="success">Ativo</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Modelo de IA</p>
                <p className="text-sm text-gray-500">GPT-4o Mini + Whisper + OpenAI TTS</p>
              </div>
              <Badge variant="blue">OpenAI</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Voz da IA</p>
                <p className="text-sm text-gray-500">Voz feminina (Nova) em português</p>
              </div>
              <Badge variant="purple">Nova</Badge>
            </div>
          </div>

          <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
            <p className="font-semibold mb-1">⚙️ Para ativar a IA:</p>
            <ol className="list-decimal list-inside space-y-1 text-orange-700">
              <li>Adicione sua chave OpenAI no arquivo <code>.env</code></li>
              <li>Preencha o cardápio completo no painel</li>
              <li>Configure o Pix nas configurações</li>
              <li>Compartilhe o link do cardápio com seus clientes</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Integrações futuras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { name: 'WhatsApp', icon: '💬', status: 'Em breve' },
              { name: 'Instagram', icon: '📸', status: 'Em breve' },
              { name: 'iFood', icon: '🍔', status: 'Em breve' },
              { name: 'Telefone', icon: '📞', status: 'Em breve' },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-4 text-center opacity-60"
              >
                <span className="text-2xl">{integration.icon}</span>
                <p className="mt-1 text-sm font-medium text-gray-700">{integration.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{integration.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
