import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVOLUTION_URL = (process.env.WHATSAPP_API_URL || 'http://localhost:8080').replace(/\/$/, '')
const EVOLUTION_KEY = process.env.WHATSAPP_API_KEY || ''

function instanceName(restaurantId: string) {
  return `rest${restaurantId.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`
}

async function evoGet(path: string) {
  try {
    const res = await fetch(`${EVOLUTION_URL}${path}`, {
      method: 'GET',
      headers: { apikey: EVOLUTION_KEY },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  } catch {
    return { ok: false, data: {} }
  }
}

async function evoPost(path: string, body: unknown) {
  try {
    const res = await fetch(`${EVOLUTION_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  } catch {
    return { ok: false, data: {} }
  }
}

async function evoDel(path: string) {
  try {
    const res = await fetch(`${EVOLUTION_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      cache: 'no-store',
    })
    return { ok: res.ok }
  } catch {
    return { ok: false }
  }
}

// GET — status da conexão + QR code
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.id },
      select: { id: true, whatsappInstance: true, whatsappStatus: true, whatsappPhone: true },
    })
    if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const instance = restaurant.whatsappInstance || instanceName(restaurant.id)

    const stateRes = await evoGet(`/instance/connectionState/${instance}`)
    const state: string = stateRes.data?.instance?.state || 'close'
    const newStatus = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected'

    // Captura número quando conectado
    let phone = restaurant.whatsappPhone
    if (state === 'open' && !phone) {
      const infoRes = await evoGet(`/instance/fetchInstances?instanceName=${instance}`)
      const info = Array.isArray(infoRes.data) ? infoRes.data[0] : infoRes.data
      const jid: string = info?.ownerJid || ''
      if (jid) phone = jid.replace(/@.+/, '')
    }

    // Atualiza banco se mudou
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { whatsappInstance: instance, whatsappStatus: newStatus, whatsappPhone: phone || null },
    })

    // QR code quando conectando
    let qrcode: { pairingCode: string | null; base64: string | null } | null = null
    if (state === 'connecting') {
      const qrRes = await evoGet(`/instance/connect/${instance}`)
      if (qrRes.ok && qrRes.data?.base64) {
        qrcode = { pairingCode: qrRes.data.pairingCode || null, base64: qrRes.data.base64 }
      }
    }

    return NextResponse.json({ instance, state, status: newStatus, phone, qrcode })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[WhatsApp GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST — inicia conexão / gera QR code
export async function POST() {
  let step = 'session'
  try {
    const session = await getSession()
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    step = 'find-restaurant'
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.id },
      select: { id: true, whatsappInstance: true },
    })
    if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const instance = restaurant.whatsappInstance || instanceName(restaurant.id)

    step = 'check-state'
    const stateRes = await evoGet(`/instance/connectionState/${instance}`)
    const currentState: string = stateRes.data?.instance?.state || ''

    if (currentState === 'open') {
      return NextResponse.json({ status: 'connected', message: 'Já conectado' })
    }

    // Se existe mas não está aberta, deleta para recriar limpo
    if (stateRes.ok && currentState) {
      step = 'delete-old'
      await evoDel(`/instance/delete/${instance}`)
      await new Promise(r => setTimeout(r, 2000))
    }

    step = 'create-instance'
    const createRes = await evoPost('/instance/create', {
      instanceName: instance,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    })

    if (!createRes.ok) {
      return NextResponse.json({ error: `Falha ao criar instância: ${JSON.stringify(createRes.data)}` }, { status: 500 })
    }

    step = 'save-db'
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { whatsappInstance: instance, whatsappStatus: 'connecting', whatsappPhone: null },
    })

    const qrBase64: string = createRes.data?.qrcode?.base64 || ''
    const qrPairing: string = createRes.data?.qrcode?.pairingCode || ''

    let finalBase64 = qrBase64
    if (!finalBase64) {
      step = 'fetch-qr'
      await new Promise(r => setTimeout(r, 3000))
      const qrRes = await evoGet(`/instance/connect/${instance}`)
      finalBase64 = qrRes.data?.base64 || ''
    }

    return NextResponse.json({
      status: 'connecting',
      instance,
      qrcode: { pairingCode: qrPairing || null, base64: finalBase64 || null },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[WhatsApp POST step=${step}]`, msg)
    return NextResponse.json({ error: `Erro em ${step}: ${msg}` }, { status: 500 })
  }
}

// DELETE — desconecta
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.id },
      select: { id: true, whatsappInstance: true },
    })

    if (restaurant?.whatsappInstance) {
      await evoDel(`/instance/delete/${restaurant.whatsappInstance}`)
    }

    await prisma.restaurant.update({
      where: { id: session.id },
      data: { whatsappInstance: null, whatsappStatus: 'disconnected', whatsappPhone: null },
    })

    return NextResponse.json({ status: 'disconnected' })
  } catch (err) {
    console.error('[WhatsApp DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
