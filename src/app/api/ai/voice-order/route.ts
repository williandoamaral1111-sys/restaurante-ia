import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as File
    const restaurantId = formData.get('restaurantId') as string
    const sessionId = formData.get('sessionId') as string
    const historyRaw = formData.get('history') as string

    if (!audioBlob || !restaurantId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Buscar dados do restaurante para contexto
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        categories: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
        menuItems: {
          where: { available: true },
          include: { category: { select: { name: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!restaurant) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // 2. Transcrição com Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
      language: 'pt',
    })

    const userText = transcription.text.trim()
    if (!userText) {
      return Response.json({
        transcript: '',
        reply: 'Não entendi. Pode repetir?',
        audio: null,
      })
    }

    // 3. Montar contexto do cardápio
    const menuContext = restaurant.menuItems
      .map((item) => `- ${item.name} (${item.category?.name || 'Sem categoria'}): R$${item.price.toFixed(2)}`)
      .join('\n')

    const openingHours = restaurant.openingHours
      ? JSON.stringify(restaurant.openingHours)
      : 'Não informado'

    // 4. Histórico de conversa
    const history: { role: 'user' | 'assistant'; content: string }[] = historyRaw
      ? JSON.parse(historyRaw).slice(-6).map((m: any) => ({
          role: m.role,
          content: m.content,
        }))
      : []

    // 5. Chat com GPT-4
    const systemPrompt = `Você é a assistente virtual de atendimento por voz do restaurante "${restaurant.name}".
Seu objetivo é ajudar o cliente a fazer pedidos, tirar dúvidas e oferecer uma experiência agradável.

CARDÁPIO DISPONÍVEL:
${menuContext}

INFORMAÇÕES DO RESTAURANTE:
- Taxa de entrega: R$${restaurant.deliveryFee.toFixed(2)}
- Pedido mínimo: R$${restaurant.minOrderValue.toFixed(2)}
- Tempo estimado: ${restaurant.estimatedTime} minutos
- Horários: ${openingHours}

INSTRUÇÕES:
1. Responda SEMPRE em português brasileiro, de forma natural e amigável
2. Seja concisa - respostas curtas para áudio (máx 3 frases)
3. Sugira pratos quando o cliente não sabe o que pedir
4. Confirme os itens antes de finalizar
5. Se o cliente quiser fazer um pedido, liste os itens e peça confirmação
6. Não invente itens que não estão no cardápio
7. Informe sobre taxas e tempo quando perguntado
8. Use linguagem natural como se fosse uma atendente humana`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userText },
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'Desculpe, não entendi. Pode repetir?'

    // 6. Text-to-Speech
    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: reply,
      response_format: 'mp3',
    })

    const audioBuffer = await ttsResponse.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    return Response.json({
      transcript: userText,
      reply,
      audio: audioBase64,
    })
  } catch (error) {
    console.error('Voice order error:', error)
    return Response.json(
      { error: 'Failed to process voice order' },
      { status: 500 }
    )
  }
}
