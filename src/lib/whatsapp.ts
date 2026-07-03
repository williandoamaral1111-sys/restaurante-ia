interface OrderNotificationData {
  orderNumber: number
  restaurantName: string
  restaurantPhone: string | null
  restaurantWhatsappInstance: string | null
  customerName: string
  customerPhone: string
  items: { itemName: string; quantity: number; totalPrice: number }[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  address: {
    street: string; number: string; complement: string | null
    neighborhood: string; city: string
  } | null
  notes: string | null
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  CASH: 'Dinheiro',
  VOUCHER: 'Vale-Refeição',
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

function buildMessage(data: OrderNotificationData): string {
  const currency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const lines: string[] = [
    `🍔 *NOVO PEDIDO #${data.orderNumber}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `👤 *Cliente:* ${data.customerName}`,
    `📱 *Fone:* ${data.customerPhone}`,
    ``,
    `🛒 *Itens do pedido:*`,
    ...data.items.map((i) => `  • ${i.quantity}x ${i.itemName} — ${currency(i.totalPrice)}`),
    ``,
  ]

  if (data.address) {
    lines.push(`📍 *Endereço de entrega:*`)
    lines.push(`  ${data.address.street}, ${data.address.number}${data.address.complement ? ` - ${data.address.complement}` : ''}`)
    lines.push(`  ${data.address.neighborhood}, ${data.address.city}`)
    lines.push(``)
  }

  lines.push(`💳 *Pagamento:* ${PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod}`)
  lines.push(``)

  if (data.deliveryFee > 0) {
    lines.push(`Subtotal: ${currency(data.subtotal)}`)
    lines.push(`Entrega: ${currency(data.deliveryFee)}`)
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`💰 *TOTAL: ${currency(data.total)}*`)

  if (data.notes) {
    lines.push(``)
    lines.push(`📝 *Obs:* ${data.notes}`)
  }

  return lines.join('\n')
}

async function sendViaEvolutionApi(instance: string, phone: string, message: string): Promise<void> {
  const url = process.env.WHATSAPP_API_URL
  const key = process.env.WHATSAPP_API_KEY

  if (!url || !key) throw new Error('Evolution API não configurada')

  const res = await fetch(`${url}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key },
    body: JSON.stringify({
      number: phone,
      textMessage: { text: message },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API error: ${res.status} ${err}`)
  }
}

export async function sendOrderToWhatsApp(data: OrderNotificationData): Promise<void> {
  // Precisa ter instância própria do restaurante conectada
  if (!data.restaurantWhatsappInstance) {
    console.log('[WhatsApp] Restaurante sem WhatsApp conectado, notificação ignorada')
    return
  }

  if (!data.restaurantPhone) {
    console.log('[WhatsApp] Restaurante sem telefone cadastrado, notificação ignorada')
    return
  }

  if (!process.env.WHATSAPP_API_URL) {
    const phone = formatPhone(data.restaurantPhone)
    const message = buildMessage(data)
    console.log(`\n[WhatsApp] Mensagem que seria enviada para ${phone}:\n${message}\n`)
    return
  }

  const phone = formatPhone(data.restaurantPhone)
  const message = buildMessage(data)

  try {
    await sendViaEvolutionApi(data.restaurantWhatsappInstance, phone, message)
    console.log(`[WhatsApp] Pedido #${data.orderNumber} enviado para ${phone} via instância ${data.restaurantWhatsappInstance}`)
  } catch (err) {
    console.error('[WhatsApp] Falha ao enviar notificação:', err)
  }
}
