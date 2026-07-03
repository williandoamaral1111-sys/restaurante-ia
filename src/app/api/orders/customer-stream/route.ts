import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { customerSubs, addSubscriber, removeSubscriber } from '@/lib/sse'

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const customerId = request.nextUrl.searchParams.get('customerId')

  if (!session || session.role !== 'customer' || session.id !== customerId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      addSubscriber(customerSubs, customerId, controller)

      const heartbeat = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(': heartbeat\n\n')) }
        catch { clearInterval(heartbeat) }
      }, 25000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        removeSubscriber(customerSubs, customerId, controller)
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
