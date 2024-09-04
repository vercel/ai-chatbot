/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  },
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NEXT_PUBLIC_STRIPE_KEY:process.env.NEXT_PUBLIC_STRIPE_KEY,
    NEXT_PUBLIC_STRIPE_SECRET:process.env.NEXT_PUBLIC_STRIPE_SECRET
  }
}
