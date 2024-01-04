/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    windowHistorySupport: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  }
}
