import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { guestRegex, isDevelopmentEnvironment } from './lib/constants'

export async function middleware (request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? 'localhost:3000'

  // 1. Определяем домен для админ-панели
  const appHostname =
    process.env.NODE_ENV === 'production'
      ? 'app.welcome-onboard.ru'
      : 'app.localhost:3000'

  // 2. Исключаем служебные пути из всей логики
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('/favicon.ico') ||
    url.pathname.startsWith('/api/ping') // Оставляем ping для тестов
  ) {
    return NextResponse.next()
  }

  // 3. Маршрутизация: проверяем, является ли запрос к админ-панели
  if (hostname === appHostname) {
    // --- НАЧАЛО: ЛОГИКА ДЛЯ АДМИН-ПАНЕЛИ (app.welcome-onboard.ru) ---

    // Пропускаем API-вызовы аутентификации, чтобы избежать циклов редиректа
    if (url.pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }

    // Получаем токен пользователя
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: !isDevelopmentEnvironment,
    })

    // Если токена нет, создаем гостевую сессию и редиректим
    if (!token) {
      const redirectUrl = encodeURIComponent(request.url)
      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
      )
    }

    // Если пользователь залогинен (не гость), не пускаем его на /login и /register
    const isGuest = guestRegex.test(token?.email ?? '')
    if (token && !isGuest && ['/login', '/register'].includes(url.pathname)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Если все проверки пройдены, переписываем путь на директорию (app)
    url.pathname = `/app${url.pathname}`
    return NextResponse.rewrite(url)

    // --- КОНЕЦ: ЛОГИКА ДЛЯ АДМИН-ПАНЕЛИ ---
  }

  // 4. Маршрутизация для публичного сайта (welcome-onboard.ru)
  // Для всех остальных запросов показываем контент из директории (site)
  url.pathname = `/site${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Сопоставляем все пути, кроме тех, что явно исключены в коде выше
     * (например, _next/static, _next/image, favicon.ico).
     * Это обеспечивает, что наш middleware будет анализировать каждый релевантный запрос.
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
