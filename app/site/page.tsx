/**
 * @file app/(site)/page.tsx
 * @description Лендинг-заглушка для основного домена.
 * @version 1.0.0
 * @date 2025-06-12
 * @updated Начальная версия.
 */

export default function LandingPage () {
  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center bg-background text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          WelcomeCraft 🚀
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          Добро пожаловать в проект!
        </p>
        {/*<p className="text-sm text-muted-foreground">*/}
        {/*  (Эта страница рендерится из `app/(site)/page.tsx`)*/}
        {/*</p>*/}
        {/*<div className="flex justify-center pt-4">*/}
        {/*  <Link*/}
        {/*    href="http://app.welcome-onboard.ru" // Локально: http://app.localhost:3000*/}
        {/*    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"*/}
        {/*    prefetch={false}*/}
        {/*  >*/}
        {/*    Перейти в приложение*/}
        {/*  </Link>*/}
        {/*</div>*/}
      </div>
    </div>
  )
}

// END OF: app/(site)/page.tsx