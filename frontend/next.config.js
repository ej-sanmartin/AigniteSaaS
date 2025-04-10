/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
    AVATAR_REFRESH_INTERVAL: process.env.NEXT_PUBLIC_AVATAR_REFRESH_INTERVAL,
  },
  // ...other config
}

module.exports = nextConfig