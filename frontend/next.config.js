/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
  },
  // ...other config
}

module.exports = nextConfig 