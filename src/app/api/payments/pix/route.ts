import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Gerador de QR Code Pix estático (sem API externa)
// Para produção, integre com EFI Bank (Gerencianet) ou Mercado Pago

function generatePixPayload(
  pixKey: string,
  amount: number,
  merchantName: string,
  txId: string,
  description: string
): string {
  function tlv(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0')
    return `${id}${len}${value}`
  }

  function crc16(data: string): string {
    let crc = 0xffff
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
  }

  const merchantAccount = tlv(
    '26',
    tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', pixKey)
  )

  const additionalData = tlv('05', txId.slice(0, 25).replace(/\s/g, ''))
  const merchantAccountData = tlv('62', additionalData)

  const amountStr = amount.toFixed(2)
  const nameClean = merchantName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .slice(0, 25)

  let payload =
    tlv('00', '01') +          // Payload format
    merchantAccount +           // Merchant account
    tlv('52', '0000') +         // MCC
    tlv('53', '986') +          // Currency BRL
    tlv('54', amountStr) +      // Amount
    tlv('58', 'BR') +           // Country
    tlv('59', nameClean) +      // Merchant name
    tlv('60', 'SAO PAULO') +    // Merchant city
    merchantAccountData         // Additional data

  payload += tlv('63', '0000') // CRC placeholder
  const crc = crc16(payload.slice(0, -4))
  return payload.slice(0, -4) + crc
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: { select: { pixKey: true, pixKeyType: true, pixMerchantName: true } } },
    })

    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
    if (!order.restaurant.pixKey) {
      return Response.json({ error: 'Restaurant has no Pix key configured' }, { status: 400 })
    }

    const txId = `ORDER${order.orderNumber}${Date.now().toString(36).toUpperCase()}`
    const pixPayload = generatePixPayload(
      order.restaurant.pixKey,
      order.total,
      order.restaurant.pixMerchantName || 'Restaurante',
      txId,
      `Pedido #${order.orderNumber}`
    )

    // Atualizar pedido com txId
    await prisma.order.update({
      where: { id: orderId },
      data: { pixTxId: txId, pixQrCodeText: pixPayload },
    })

    return Response.json({
      pixQrCodeText: pixPayload,
      txId,
      amount: order.total,
      pixKey: order.restaurant.pixKey,
      pixKeyType: order.restaurant.pixKeyType,
      merchantName: order.restaurant.pixMerchantName,
    })
  } catch (error) {
    return Response.json({ error: 'Failed to generate Pix' }, { status: 500 })
  }
}

// Webhook para confirmação de pagamento Pix (EFI Bank / Mercado Pago)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // EFI Bank webhook format
    const txId = body?.pix?.[0]?.txid || body?.txId
    if (!txId) return Response.json({ error: 'Invalid webhook' }, { status: 400 })

    const order = await prisma.order.findFirst({
      where: { pixTxId: txId },
    })

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          pixPaidAt: new Date(),
        },
      })
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Webhook error' }, { status: 500 })
  }
}
