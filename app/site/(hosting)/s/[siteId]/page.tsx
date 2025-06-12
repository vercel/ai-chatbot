/**
 * @file app/(site)/(hosting)/s/[siteId]/page.tsx
 * @description Страница для отображения сгенерированного сайта по его ID.
 * @version 1.1.0
 * @date 2025-06-12
 * @updated Load site artifact and render blocks via SiteRenderer.
 */

/** HISTORY:
 * v1.1.0 (2025-06-12): Load site artifact via SiteRenderer.
 * v1.0.0 (2025-06-12): Начальная версия.
 */

import SiteRenderer from './site-renderer'

interface SitePageProps {
  params: Promise<{ siteId: string }>
}

export default async function HostedSitePage (props: SitePageProps) {
  const { siteId } = await props.params
  return <SiteRenderer siteId={siteId} />
}

// END OF: app/(site)/(hosting)/s/[siteId]/page.tsx
