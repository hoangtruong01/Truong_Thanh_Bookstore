# ==========================================
# Multi-stage Production Dockerfile: Vue 3 Frontend
# Hardened: Running as unprivileged non-root user
# ==========================================

# Stage 1: Build Vue 3 with Vite
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx Unprivileged Alpine
FROM nginxinc/nginx-unprivileged:alpine AS runner

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
