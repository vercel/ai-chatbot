/**
 * @file app/(main)/layout.tsx
 * @description Основной серверный макет приложения. Отвечает за получение сессии и рендеринг клиентской обертки.
 * @version 1.2.0
 * @date 2025-06-05
 * @updated Разделен на серверный и клиентский компоненты. Этот файл теперь является чистым серверным компонентом.
 */

/** HISTORY:
 * v1.2.0 (2025-06-05): Рефакторинг. Логика, использующая 'use client', вынесена в 'main-layout-client.tsx'. Этот файл теперь является серверным.
 * v1.1.0 (2025-06-05): Внедрена динамическая сетка для split-view артефакта. Компонент Artifact теперь управляется глобально.
 * v1.0.0 (2025-05-25): Начальная версия макета.
 */

import Script from 'next/script';
import { auth } from '@/app/(app)/(auth)/auth';
import { MainLayoutClient } from '@/components/main-layout-client';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <MainLayoutClient session={session}>
        {children}
      </MainLayoutClient>
    </>
  );
}

// END OF: app/(main)/layout.tsx
