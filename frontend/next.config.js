/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
  },
  // ...other config
}

module.exports = nextConfig