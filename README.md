# 🚀 AIgnite SaaS - Full-Stack SaaS Template

A modern, production-ready template for building SaaS applications with separate frontend and backend services. This template provides a solid foundation for quickly launching new SaaS projects with a focus on maintainability, security, and scalability.

## ⚡ Quick Start

1. Fork this repository
2. Clone your forked repository
3. Follow setup instructions in [frontend](./frontend/README.md) and [backend](./backend/README.md) directories

## 🏗️ Architecture

This template uses a microservices architecture with:

### 🎨 Frontend (`/frontend`)
- **Framework**: Next.js 14 with React 18 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API Client**: Axios
- **Features**:
  - User authentication
  - Dashboard layout
  - Responsive design
  - Environment configuration
  - Type-safe development
  - Dark/Light theme support
  - Progressive Web App (PWA) ready
  - SEO optimization
  - Landing page components

### ⚙️ Backend (`/backend`)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with raw SQL
- **Authentication**: JWT
- **Features**:
  - RESTful API endpoints
  - User authentication & authorization
  - Database integration
  - Environment configuration
  - Type-safe development

## ✨ Key Features
- Modern TypeScript-first development
- Separate deployable services
- Production-ready configuration
- JWT-based authentication with OAuth support (Google, LinkedIn)
- Email verification flow
- Stripe subscription integration
- User management
- Database integration with PostgreSQL
- Environment configuration
- PWA support with service worker
- SEO-friendly with sitemap and robots.txt
- Dark/Light theme switching
- Landing page components
- Mobile-responsive design

## 🎯 Feature Wishlist
- **🧪 Testing Infrastructure**
  - Unit tests with Jest
  - Integration tests with Supertest
  - E2E tests with Cypress
  - Test coverage reporting

- **📝 Blogging System**
  - Markdown support
  - Rich text editor
  - Categories and tags
  - SEO optimization
  - Comment system

- **📚 API Documentation**
  - OpenAPI/Swagger integration
  - Automated documentation generation
  - Interactive API explorer
  - Code examples

- **🔐 Authorization System**
  - Role-based access control (RBAC)
  - Permission management
  - Role hierarchy
  - Audit logging

## 🛠️ Getting Started

### 📋 Prerequisites
- Node.js (v18.17.0 or higher)
- npm (v9.0.0 or higher)
- PostgreSQL (v14 or higher)

### 💻 Development Setup

1. Frontend Setup:
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

2. Backend Setup:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

3. Database Setup:
```bash
# Follow instructions in backend/db/README.md for your OS
# For MacOS:
brew install postgresql@14
brew services start postgresql@14
createdb saas_dev
createuser -P saas_user
```

Visit:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## 📝 Development Guidelines
- Follow Google TypeScript Style Guide
- Write clean, maintainable code
- Keep services independent
- Use environment variables for configuration
- Follow REST API best practices
- Implement proper error handling
- Write safe database queries
- Ensure PWA compliance
- Optimize for SEO
- Follow accessibility best practices

## 🚀 Deployment

The frontend and backend are designed to be deployed separately:

### 🌐 Frontend
- Can be deployed to Vercel, Netlify, or any static hosting
- Configure environment variables
- Set up build commands

### 🔧 Backend
- Can be deployed to any Node.js hosting (Heroku, DigitalOcean, etc.)
- Set up database connection
- Configure environment variables
- Set up SSL/TLS

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⭐ Support

If you find this template helpful, please consider giving it a star! It helps others discover this template.
