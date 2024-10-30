import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  console.log(locale)
  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});
