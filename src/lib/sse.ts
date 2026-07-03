// Shared SSE subscriber maps — module-level globals persist across requests in same process
export const restaurantSubs = new Map<string, Set<ReadableStreamDefaultController>>()
export const customerSubs = new Map<string, Set<ReadableStreamDefaultController>>()

export function broadcastToRestaurant(restaurantId: string, event: unknown) {
  const subs = restaurantSubs.get(restaurantId)
  if (!subs?.size) return
  const data = `data: ${JSON.stringify(event)}\n\n`
  const encoded = new TextEncoder().encode(data)
  subs.forEach((ctrl) => { try { ctrl.enqueue(encoded) } catch {} })
}

export function broadcastToCustomer(customerId: string, event: unknown) {
  const subs = customerSubs.get(customerId)
  if (!subs?.size) return
  const data = `data: ${JSON.stringify(event)}\n\n`
  const encoded = new TextEncoder().encode(data)
  subs.forEach((ctrl) => { try { ctrl.enqueue(encoded) } catch {} })
}

export function addSubscriber(
  map: Map<string, Set<ReadableStreamDefaultController>>,
  key: string,
  ctrl: ReadableStreamDefaultController
) {
  if (!map.has(key)) map.set(key, new Set())
  map.get(key)!.add(ctrl)
}

export function removeSubscriber(
  map: Map<string, Set<ReadableStreamDefaultController>>,
  key: string,
  ctrl: ReadableStreamDefaultController
) {
  map.get(key)?.delete(ctrl)
}
