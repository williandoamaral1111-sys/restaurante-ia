import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { WhatsAppConnect } from '@/components/dashboard/whatsapp-connect'

export default async function WhatsAppPage() {
  const session = await getSession()
  if (!session || session.role !== 'restaurant') redirect('/login')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">WhatsApp</h1>
      <p className="text-sm text-gray-500 mb-8">
        Conecte o WhatsApp do seu restaurante para receber notificações de novos pedidos.
      </p>
      <WhatsAppConnect />
    </div>
  )
}
