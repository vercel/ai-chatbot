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
    OPEN_AI_KEY: process.env.OPEN_AI_KEY
  }
}
