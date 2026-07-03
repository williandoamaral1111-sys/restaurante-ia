import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { restaurantSubs, addSubscriber, removeSubscriber } from '@/lib/sse'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const restaurantId = request.nextUrl.searchParams.get('restaurantId')

  if (!session || session.role !== 'restaurant' || session.id !== restaurantId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      addSubscriber(restaurantSubs, restaurantId, controller)

      const heartbeat = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(': heartbeat\n\n')) }
        catch { clearInterval(heartbeat) }
      }, 25000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        removeSubscriber(restaurantSubs, restaurantId, controller)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
