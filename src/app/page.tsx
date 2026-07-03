import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getSession()

  if (session?.role === 'restaurant') redirect('/dashboard')
  if (session?.role === 'customer') redirect('/buscar')

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-xl">🍽️</div>
            <span className="text-lg font-bold text-gray-900">RestauranteIA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Entrar
            </Link>
            <Link
              href="/cadastro-restaurante"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Cadastrar Restaurante
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700">
          🤖 IA de Voz + Cardápio Digital
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl">
          Seu restaurante com{' '}
          <span className="text-orange-500">atendimento por IA</span>{' '}
          24 horas
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
          Cardápio digital moderno, pedidos em tempo real, pagamento via Pix automático
          e uma IA que atende seus clientes por voz — tudo em um só lugar.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/cadastro-restaurante"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-8 text-base font-bold text-white shadow-lg transition hover:bg-orange-600"
          >
            Começar grátis →
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Ver demonstração
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: '🎙️',
              title: 'IA de Atendimento por Voz',
              desc: 'Clientes fazem pedidos falando com a assistente virtual. Ela entende, sugere pratos e confirma o pedido automaticamente.',
            },
            {
              icon: '📱',
              title: 'Cardápio Digital',
              desc: 'Cardápio bonito e responsivo com fotos, categorias, adicionais e disponibilidade em tempo real.',
            },
            {
              icon: '💸',
              title: 'Pix Automático',
              desc: 'QR Code Pix gerado automaticamente. O cliente paga no app e o restaurante recebe na hora.',
            },
            {
              icon: '📊',
              title: 'Dashboard Completo',
              desc: 'Painel com pedidos em tempo real, relatórios de vendas, pratos mais vendidos e muito mais.',
            },
            {
              icon: '🔔',
              title: 'Pedidos em Tempo Real',
              desc: 'Novos pedidos chegam instantaneamente no painel. Status atualizado automaticamente para o cliente.',
            },
            {
              icon: '📈',
              title: 'Relatórios de Vendas',
              desc: 'Acompanhe o desempenho diário e mensal, formas de pagamento e pratos mais populares.',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">{feature.icon}</div>
              <h3 className="mb-2 font-bold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Restaurante */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-center text-white shadow-xl">
          <h2 className="text-2xl font-bold">Pronto para modernizar seu restaurante?</h2>
          <p className="mt-2 text-orange-100">Crie sua conta grátis e comece a receber pedidos hoje.</p>
          <Link
            href="/cadastro-restaurante"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-bold text-orange-600 shadow-lg transition hover:bg-orange-50"
          >
            Criar conta grátis →
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} RestauranteIA — Todos os direitos reservados
      </footer>
    </div>
  )
}
