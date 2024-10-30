import { Metadata } from "next";
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from "sonner";
 
import { Navbar } from "@/components/custom/navbar";
import { ThemeProvider } from "@/components/custom/theme-provider";

import {routing} from '../../lib/i18n/routing';

import "../globals.css";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  //metadataBase: new URL("https://chat.vercel.ai"),
  title: "Campaigns Assistant",
  description: "AI Chatbot with access to knowledge and tools.",
};

export default async function LocaleLayout({
  children,
  params: paramsPromise,
}: LocaleLayoutProps) {
  const { locale } = await paramsPromise;

  // Ensure the `locale` is valid
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Fetch messages for the provided locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            <Navbar />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
