# ── Frontend Dockerfile ────────────────────────────────────────────────────────
# Google Cloud Run — React + Vite Frontend
# Multi-stage: Node builds the app, Nginx serves the static files

# Stage 1: Build the React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (leverages Docker layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for the build)
RUN npm ci

# Copy the rest of the source
COPY . .

# Vite bakes env vars at BUILD TIME via import.meta.env.VITE_*
# Pass Firebase config as build args so the Docker build can inject them.
# These are set as --build-arg flags in the gcloud / Cloud Build command.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_BACKEND_URL

# Write the .env file from build args so Vite picks them up
RUN echo "VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}" >> .env && \
    echo "VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}" >> .env && \
    echo "VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}" >> .env && \
    echo "VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}" >> .env && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}" >> .env && \
    echo "VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" >> .env && \
    echo "VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}" >> .env && \
    echo "VITE_BACKEND_URL=${VITE_BACKEND_URL}" >> .env

RUN npm run build


# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS runtime

# Remove the default Nginx config and replace with ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build output into the Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run requires listening on port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
