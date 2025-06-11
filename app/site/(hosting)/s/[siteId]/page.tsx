/**
 * @file app/(site)/(hosting)/s/[siteId]/page.tsx
 * @description Страница-заглушка для отображения сгенерированного сайта по его ID.
 * @version 1.0.1
 * @date 2025-06-11
 * @updated Converted to an async component and await props.params to fix TS2344.
 */

/** HISTORY:
 * v1.0.1 (2025-06-11): Refactored to be an async component to correctly handle promise-based params.
 * v1.0.0 (2025-06-12): Начальная версия.
 */

import Link from 'next/link'

interface SitePageProps {
  params: Promise<{
    siteId: string;
  }>;
}

export default async function HostedSitePage (props: SitePageProps) {
  const { siteId } = await props.params

  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 text-center dark:bg-gray-900">
      <div className="space-y-4 rounded-lg bg-background p-8 shadow-lg">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
          Сгенерированный сайт
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Здесь будет отображаться контент сайта с ID:
        </p>
        <div
          className="inline-block rounded-md bg-muted px-4 py-2 text-lg font-mono text-primary shadow-inner">
          {siteId}
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          (Эта страница рендерится из `app/(site)/(hosting)/s/[siteId]/page.tsx`)
        </p>
        <div className="pt-4">
          <Link href="/"
                className="text-sm text-primary hover:underline">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  )
}

// END OF: app/(site)/(hosting)/s/[siteId]/page.tsx
