import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const restaurantRoutes = ['/dashboard']
const customerRoutes = ['/pedidos', '/conta']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isRestaurantRoute = restaurantRoutes.some((route) => pathname.startsWith(route))
  const isCustomerRoute = customerRoutes.some((route) => pathname.startsWith(route))

  if (!isRestaurantRoute && !isCustomerRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value
  const session = token ? await verifyToken(token) : null

  if (isRestaurantRoute) {
    if (!session || session.role !== 'restaurant') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (isCustomerRoute) {
    if (!session || session.role !== 'customer') {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/pedidos/:path*', '/conta/:path*'],
}
