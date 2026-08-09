# ── Stage 1: Build React/Vite app ────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./
RUN npm ci --prefer-offline

# Accept VITE_ build-time environment variables
# These are embedded into the JS bundle at build time — never secrets
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_ENABLE_DAILY=false
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID
ENV VITE_ENABLE_DAILY=$VITE_ENABLE_DAILY

# Copy source (root .dockerignore excludes node_modules, .env, server/node_modules, etc.)
COPY . .

# Build production bundle
RUN npm run build

# ── Stage 2: Serve with NGINX ─────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (proxies /api/ and /socket.io/ to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
