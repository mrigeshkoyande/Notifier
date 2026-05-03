# ── Root Dockerfile ────────────────────────────────────────────────────────────
# This file exists at the repo root to support:
#   - Cloud Run "Deploy from source" (auto-detects Dockerfile at root)
#   - Cloud Build Docker triggers   (docker build . from /workspace/)
#   - Manual local builds           (docker build -t notifier .)
#
# Builds the React/Vite frontend and serves it with Nginx on port 8080.
#
# Firebase config is injected at BUILD TIME via --build-arg.
# In Cloud Run "Deploy from source": set these in the console under
#   "Build environment variables" when connecting the repo.
# In Cloud Build trigger: add them as substitution variables.

# ── Stage 1: Build the React app ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept Firebase config as build-time arguments
# (Vite bakes these into the JS bundle at build time via import.meta.env.VITE_*)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_BACKEND_URL

# Copy frontend source from the test-vite-app subdirectory
COPY test-vite-app/package.json test-vite-app/package-lock.json ./

RUN npm ci

COPY test-vite-app/ .

# Write .env so Vite picks up the build args
RUN echo "VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}" >> .env && \
    echo "VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}" >> .env && \
    echo "VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}" >> .env && \
    echo "VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}" >> .env && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}" >> .env && \
    echo "VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" >> .env && \
    echo "VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}" >> .env && \
    echo "VITE_BACKEND_URL=${VITE_BACKEND_URL}" >> .env

RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default Nginx config and use our SPA-aware config
RUN rm /etc/nginx/conf.d/default.conf
COPY test-vite-app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run requires listening on port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
