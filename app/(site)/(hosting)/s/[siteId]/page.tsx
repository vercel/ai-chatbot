/**
 * @file app/(site)/(hosting)/s/[siteId]/page.tsx
 * @description Страница-заглушка для отображения сгенерированного сайта по его ID.
 * @version 1.0.0
 * @date 2025-06-12
 * @updated Начальная версия.
 */

import Link from 'next/link'


interface SitePageProps {
  params: {
    siteId: string;
  };
}

export default function HostedSitePage ({ params }: SitePageProps) {
  const { siteId } = params

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