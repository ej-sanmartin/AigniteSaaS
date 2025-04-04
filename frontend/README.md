# 🎨 Frontend Application

## 📋 Overview
This is the frontend application built with Next.js, React, and TypeScript, providing a modern and responsive user interface with PWA capabilities and SEO optimization.

## ⚙️ Requirements
- Node.js (v18.17.0 or higher)
- npm (v9.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Tech Stack
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS
- Axios

## ✨ Features
- Progressive Web App (PWA) support
- Dark/Light theme switching
- SEO optimization with dynamic sitemap
- Responsive landing page components
- Isomorphic layout effects
- Mobile-first design
- Type-safe context providers
- Performance optimized

## 🚀 Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure
```
frontend/
├── public/
│   ├── sw.js
│   ├── sitemap.xml
│   └── robots.txt
├── src/
│   ├── app/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   └── landing/
│   ├── contexts/
│   ├── hooks/
│   ├── store/
│   ├── styles/
│   ├── types/
│   └── utils/
├── package.json
├── next.config.js
└── tsconfig.json
```

## 📜 Available Scripts
- `npm run dev` - Starts development server
- `npm run build` - Creates production build
- `npm start` - Runs production server
- `npm run type-check` - Runs TypeScript compiler check

## 📝 Development Guidelines
- Follow Google TypeScript Style Guide
- Use Next.js App Router best practices
- Implement responsive designs using Tailwind
- Ensure PWA compliance
- Optimize for SEO
- Follow accessibility standards
- Use TypeScript strict mode
- Follow component-driven development
- Implement proper error boundaries
- Optimize for performance

## 📱 PWA Support
The application includes service worker configuration for offline support and improved performance. The `sw.js` file handles caching strategies and updates.

## 🔍 SEO Optimization
- Dynamic sitemap generation
- Robots.txt configuration
- Meta tags management
- Structured data implementation
- OpenGraph tags support

## 🌓 Theme Support
The application includes a theme context for managing dark/light mode preferences with system preference detection and persistent storage.
