import type { NextConfig } from 'next'
import type { WebpackPluginInstance } from 'webpack'

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },

  /**
   * Кастомная конфигурация Webpack для отключения логов от tsconfig-paths-webpack-plugin.
   * @param {import('webpack').Configuration} config - Текущая конфигурация Webpack.
   * @returns {import('webpack').Configuration} - Измененная конфигурация.
   */
  webpack: (config) => {
    // Находим плагин TsconfigPathsPlugin в массиве плагинов для разрешения модулей.
    const tsconfigPathsPlugin = config.resolve.plugins?.find(
      (plugin: WebpackPluginInstance) =>
        plugin.constructor.name === 'TsconfigPathsPlugin'
    )

    if (tsconfigPathsPlugin) {
      // Устанавливаем опцию 'silent' в 'true', чтобы отключить подробный вывод.
      (tsconfigPathsPlugin as any).options.silent = true
    }

    // Возвращаем измененную конфигурацию.
    return config
  },
  serverComponentsExternalPackages: ['pino'],
}

export default nextConfig
