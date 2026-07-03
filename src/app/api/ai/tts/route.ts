import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    if (!text) return Response.json({ error: 'No text provided' }, { status: 400 })

    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text.slice(0, 500),
      response_format: 'mp3',
    })

    const buffer = await ttsResponse.arrayBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return Response.json({ error: 'TTS failed' }, { status: 500 })
  }
}
