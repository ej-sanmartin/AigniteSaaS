# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/ .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy environment variables
COPY backend/.env.production .env

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"] 