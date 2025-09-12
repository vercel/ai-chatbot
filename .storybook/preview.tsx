import type { Preview } from '@storybook/nextjs-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    docs: {
      toc: true,
    },

    themes: {
      default: 'light',
      list: [
        { name: 'light', class: 'light', color: '#ffffff' },
        { name: 'dark', class: 'dark', color: '#000000' },
      ],
    },
  },

  decorators: [
    (Story) => (
      <div className={`${GeistSans.className} ${GeistMono.variable}`}>
        <Story />
      </div>
    ),
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;