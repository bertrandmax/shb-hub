import { headers } from 'next/headers'

function getOriginFromHeaders(headersList: Headers) {
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const proto = headersList.get('x-forwarded-proto') ?? 'https'

  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL
}

export function getOrigin() {
  return getOriginFromHeaders(headers())
}

export function getRequestOrigin(request: Request) {
  return getOriginFromHeaders(request.headers) ?? new URL(request.url).origin
}
