'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceOrderButtonProps {
  restaurantId: string
  restaurantName: string
}

type AIState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function VoiceOrderButton({ restaurantId, restaurantName }: VoiceOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const [aiState, setAiState] = useState<AIState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const sessionIdRef = useRef<string>(`session-${Date.now()}`)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function openModal() {
    setOpen(true)
    setMessages([
      {
        role: 'assistant',
        content: `Olá! Sou a assistente virtual do ${restaurantName}. Como posso te ajudar hoje? Você pode me pedir para mostrar o cardápio, fazer um pedido ou tirar dúvidas sobre entregas.`,
        timestamp: new Date(),
      },
    ])
    playWelcomeAudio()
  }

  function closeModal() {
    stopListening()
    setOpen(false)
    setMessages([])
    setTranscript('')
    sessionIdRef.current = `session-${Date.now()}`
  }

  async function playWelcomeAudio() {
    // TTS para a mensagem de boas-vindas
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Olá! Sou a assistente virtual do ${restaurantName}. Como posso te ajudar hoje?`,
        }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        setAiState('speaking')
        audio.onended = () => setAiState('idle')
        audio.play()
      }
    } catch {}
  }

  async function startListening() {
    if (aiState === 'speaking') {
      audioRef.current?.pause()
    }

    setError(null)
    setTranscript('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      setAiState('listening')
    } catch {
      setError('Sem acesso ao microfone. Verifique as permissões.')
    }
  }

  function stopListening() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (aiState === 'listening') setAiState('processing')
  }

  async function processAudio(audioBlob: Blob) {
    setAiState('processing')

    try {
      // 1. Transcrever com Whisper
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice.webm')
      formData.append('restaurantId', restaurantId)
      formData.append('sessionId', sessionIdRef.current)
      formData.append('history', JSON.stringify(messages))

      const res = await fetch('/api/ai/voice-order', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Erro no processamento')

      const { transcript: userText, reply, audio } = await res.json()

      setTranscript(userText)

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userText, timestamp: new Date() },
        { role: 'assistant', content: reply, timestamp: new Date() },
      ])

      // 2. Tocar resposta em áudio
      if (audio) {
        const audioData = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0))
        const blob = new Blob([audioData], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        const audioEl = new Audio(url)
        audioRef.current = audioEl
        setAiState('speaking')
        audioEl.onended = () => setAiState('idle')
        audioEl.play()
      } else {
        setAiState('idle')
      }
    } catch (err) {
      setError('Erro ao processar sua mensagem. Tente novamente.')
      setAiState('error')
    }
  }

  const stateConfig = {
    idle: { label: 'Falar', icon: Mic, color: 'bg-orange-500 hover:bg-orange-600' },
    listening: { label: 'Gravando...', icon: MicOff, color: 'bg-red-500 hover:bg-red-600 animate-pulse' },
    processing: { label: 'Processando...', icon: Loader2, color: 'bg-gray-500' },
    speaking: { label: 'IA falando...', icon: Volume2, color: 'bg-blue-500' },
    error: { label: 'Tentar novamente', icon: Mic, color: 'bg-orange-500 hover:bg-orange-600' },
  }

  const config = stateConfig[aiState]

  if (!open) {
    return (
      <button
        onClick={openModal}
        className="mb-5 flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white shadow-lg transition hover:from-orange-600 hover:to-orange-700"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Mic size={20} />
        </div>
        <div className="text-left">
          <p className="font-bold">Pedir por voz com IA 🎙️</p>
          <p className="text-sm text-orange-100">Fale com nossa assistente virtual</p>
        </div>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Mic size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white">IA de Voz</p>
              <p className="text-xs text-orange-100">{restaurantName}</p>
            </div>
          </div>
          <button onClick={closeModal} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Chat */}
        <div className="h-72 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {aiState === 'processing' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
                <Loader2 size={14} className="animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</div>
        )}

        {transcript && aiState !== 'listening' && (
          <div className="mx-4 mb-2 rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-400">Você disse:</p>
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        )}

        {/* Controls */}
        <div className="border-t border-gray-100 p-4">
          <p className="mb-3 text-center text-xs text-gray-400">
            {aiState === 'idle' && 'Pressione e segure para falar'}
            {aiState === 'listening' && 'Soltando para enviar...'}
            {aiState === 'processing' && 'Processando sua mensagem...'}
            {aiState === 'speaking' && 'A IA está respondendo...'}
          </p>
          <button
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all ${config.color}`}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            disabled={aiState === 'processing'}
          >
            <config.icon size={28} className={aiState === 'processing' ? 'animate-spin' : ''} />
          </button>
          <p className="mt-2 text-center text-xs font-medium text-gray-600">{config.label}</p>
        </div>
      </div>
    </div>
  )
}
