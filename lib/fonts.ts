import {
  JetBrains_Mono as FontMono,
  IBM_Plex_Sans as FontMessage,
  Inter as FontSans
} from 'next/font/google'

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

export const fontMessage = FontMessage({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-message'
})

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono'
})
