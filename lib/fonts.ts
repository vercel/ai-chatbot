import {
  Lora as FontMessage,
  JetBrains_Mono as FontMono,
  Inter as FontSans
} from 'next/font/google'

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

export const fontMessage = FontMessage({
  subsets: ['latin'],
  variable: '--font-message'
})

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono'
})
