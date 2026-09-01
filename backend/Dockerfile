# ==========================================
# Multi-stage Production Dockerfile: NestJS Backend
# ==========================================

# Stage 1: Build & Compile
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install production fonts for PDF invoice generation (pdfkit)
RUN apk add --no-cache \
    ttf-dejavu \
    font-noto \
    dumb-init

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files from builder
COPY --from=builder --chown=node:node /app/dist ./dist

# Run as non-root user for security
USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
