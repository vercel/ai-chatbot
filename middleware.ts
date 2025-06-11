import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isDevelopmentEnvironment } from './lib/constants'

export async function middleware (request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? 'localhost:3000'

  // Определяем домен для админ-панели
  const appHostname =
    process.env.NODE_ENV === 'production'
      ? 'app.welcome-onboard.ru'
      : 'app.localhost:3000'

  // Если это запрос к админ-панели
  if (hostname === appHostname) {
    // --- ИСПРАВЛЕНИЕ: Исключаем страницы входа/регистрации из проверки токена ---
    // Если пользователь уже идет на страницу входа или регистрации,
    // просто показываем ему ее, не проверяя токен.
    if (url.pathname === '/login' || url.pathname === '/register') {
      url.pathname = `/app${url.pathname}`
      return NextResponse.rewrite(url)
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: !isDevelopmentEnvironment,
    })

    // Теперь эта проверка не будет вызывать цикл для /login
    if (!token) {
      const redirectUrl = encodeURIComponent(request.url)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${redirectUrl}`, request.url))
    }

    if (token.type === 'regular' && ['/login', '/register'].includes(url.pathname)) {
      // Этот блок может быть уже не нужен, так как мы обрабатываем /login выше,
      // но оставим для защиты от прямого перехода залогиненным пользователем.
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Переписываем путь на директорию (app)
    url.pathname = `/app${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Для всех остальных запросов (публичный сайт)
  url.pathname = `/site${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Исключаем ВСЕ api роуты, так как они теперь глобальные
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
