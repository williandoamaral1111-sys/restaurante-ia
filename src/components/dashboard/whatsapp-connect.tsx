'use client'

import { useEffect, useRef, useState } from 'react'
import { Smartphone, Wifi, WifiOff, RefreshCw, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

interface QRData {
  pairingCode: string | null
  base64: string | null
}

interface WaState {
  state: string
  status: string
  phone: string | null
  qrcode: QRData | null
  instance: string | null
  error?: string
}

export function WhatsAppConnect() {
  const [wa, setWa] = useState<WaState>({ state: 'close', status: 'disconnected', phone: null, qrcode: null, instance: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isConnected = wa.state === 'open'
  const isConnecting = wa.state === 'connecting'

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  async function fetchStatus() {
    try {
      const res = await fetch('/api/dashboard/whatsapp', { cache: 'no-store' })
      const json: WaState = await res.json()
      if (!res.ok) return
      setWa(json)
      if (json.state === 'open' || json.state === 'close') stopPoll()
    } catch {}
  }

  function startPoll() {
    stopPoll()
    pollRef.current = setInterval(fetchStatus, 4000)
  }

  useEffect(() => {
    fetchStatus()
    return stopPoll
  }, [])

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/whatsapp', { method: 'POST', cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erro ao conectar. Verifique se o servidor está rodando.')
        return
      }

      setWa(prev => ({
        ...prev,
        status: json.status || 'connecting',
        state: json.status === 'connecting' ? 'connecting' : prev.state,
        qrcode: json.qrcode || null,
        instance: json.instance || prev.instance,
      }))

      if (json.status === 'connecting') startPoll()
    } catch (e) {
      setError('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      await fetch('/api/dashboard/whatsapp', { method: 'DELETE' })
      stopPoll()
      setWa({ state: 'close', status: 'disconnected', phone: null, qrcode: null, instance: null })
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className={`rounded-2xl border-2 p-6 transition-colors ${
        isConnected ? 'border-green-200 bg-green-50'
          : isConnecting ? 'border-yellow-200 bg-yellow-50'
          : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              isConnected ? 'bg-green-100' : isConnecting ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              {isConnected ? <CheckCircle className="h-6 w-6 text-green-600" />
                : isConnecting ? <RefreshCw className="h-6 w-6 animate-spin text-yellow-600" />
                : <WifiOff className="h-6 w-6 text-gray-400" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {isConnected ? 'WhatsApp Conectado' : isConnecting ? 'Aguardando escaneamento...' : 'WhatsApp Desconectado'}
              </p>
              <p className="text-sm text-gray-500">
                {isConnected && wa.phone ? `Número: ${wa.phone}` : isConnecting ? 'Escaneie o QR Code abaixo' : 'Clique em Conectar para iniciar'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Desconectar
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading || isConnecting}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                <Wifi size={14} />
                {loading ? 'Aguarde...' : isConnecting ? 'Conectando...' : 'Conectar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* QR Code */}
      {isConnecting && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Escanear QR Code</h2>
            <button
              onClick={fetchStatus}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              <RefreshCw size={12} />
              Atualizar
            </button>
          </div>

          {wa.qrcode?.base64 ? (
            <div className="flex flex-col items-center gap-5">
              <img
                src={wa.qrcode.base64}
                alt="QR Code WhatsApp"
                className="h-64 w-64 rounded-xl border-4 border-white shadow-lg"
              />

              <div className="w-full rounded-xl bg-gray-50 p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Como conectar:</p>
                <ol className="space-y-1 text-sm text-gray-600">
                  <li className="flex gap-2"><span className="font-bold text-green-600">1.</span> Abra o WhatsApp no celular</li>
                  <li className="flex gap-2"><span className="font-bold text-green-600">2.</span> <span>Vá em <strong>Configurações → Dispositivos conectados</strong></span></li>
                  <li className="flex gap-2"><span className="font-bold text-green-600">3.</span> Toque em <strong>Conectar um dispositivo</strong></li>
                  <li className="flex gap-2"><span className="font-bold text-green-600">4.</span> Aponte a câmera para o QR Code acima</li>
                </ol>
              </div>

              {wa.qrcode.pairingCode && (
                <div className="w-full rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <p className="mb-1 text-xs text-gray-500">Ou use o código de pareamento:</p>
                  <p className="font-mono text-2xl font-black tracking-widest text-gray-900">{wa.qrcode.pairingCode}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-52 flex-col items-center justify-center gap-3 text-gray-400">
              <RefreshCw size={36} className="animate-spin" />
              <p className="text-sm">Gerando QR Code, aguarde...</p>
            </div>
          )}
        </div>
      )}

      {/* Instruções quando desconectado */}
      {!isConnected && !isConnecting && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Como funciona?</p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li>• Clique em <strong>Conectar</strong> e um QR Code será exibido</li>
                <li>• Escaneie com o WhatsApp do seu restaurante</li>
                <li>• Todo novo pedido chegará automaticamente no WhatsApp</li>
                <li>• Você pode desconectar a qualquer momento</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
