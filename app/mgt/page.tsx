'use client';

import Image from 'next/image'
import { Msal2Provider } from "@microsoft/mgt-msal2-provider";
import { Login, ThemeToggle } from '@microsoft/mgt-react';

// Providers.globalProvider = new Msal2Provider({
//   clientId: '228fcaa6-c845-40be-913a-e4489ba7cb17'
// });

export default function Home() {
  return (
    <Login/>
  )
}