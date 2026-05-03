# 🚀 Deployment Guide — Google Cloud Run (GCR)

This guide explains how to deploy both services of Navix AI to Google Cloud Run.

## Architecture

```
Internet
   │
   ├── Frontend Service (Cloud Run)
   │     React + Vite → built into static files → served by Nginx
   │     URL: https://assignment-notifier-frontend-xxxx.run.app
   │
   └── Backend Service (Cloud Run)
         Flask + Gunicorn (headless — no webcam in cloud)
         URL: https://assignment-notifier-backend-xxxx.run.app
```

> **Note on Camera Features:** Cloud Run containers are headless (no physical webcam).
> The backend gracefully returns `503` on `/video_feed` and `/capture` endpoints when
> no camera is present. All other API routes (attendance management, etc.) work normally.
> For live camera features, run the backend **locally** or on a VM with a webcam.

---

## Prerequisites

1. **Google Cloud SDK** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable required APIs:**
   ```bash
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     artifactregistry.googleapis.com
   ```

3. **Create Artifact Registry repository:**
   ```bash
   gcloud artifacts repositories create navix-ai \
     --repository-format=docker \
     --location=asia-south1 \
     --description="Navix AI Docker images"
   ```

4. **Authenticate Docker with Artifact Registry:**
   ```bash
   gcloud auth configure-docker asia-south1-docker.pkg.dev
   ```

---

## Option A — Manual Deploy (First-Time / Quick)

### Step 1 — Deploy the Backend

```bash
cd Assignment-notifier-/python-backend

# Build
docker build -t asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/navix-ai/assignment-notifier-backend:latest .

# Push
docker push asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/navix-ai/assignment-notifier-backend:latest

# Deploy
gcloud run deploy assignment-notifier-backend \
  --image=asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/navix-ai/assignment-notifier-backend:latest \
  --region=asia-south1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3
```

**Copy the backend service URL** from the output — you'll need it for the frontend build.

### Step 2 — Deploy the Frontend

Replace `BACKEND_URL` with the URL from Step 1.

```bash
cd Assignment-notifier-/test-vite-app

# Build (inject Firebase config + backend URL as build args)
docker build \
  --build-arg VITE_FIREBASE_API_KEY=AIzaSyBNys7JagJc3DCyeZ-KCen9Pg21AmeweoQ \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=college-management-syste-34d63.firebaseapp.com \
  --build-arg VITE_FIREBASE_PROJECT_ID=college-management-syste-34d63 \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=college-management-syste-34d63.firebasestorage.app \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=277023675773 \
  --build-arg VITE_FIREBASE_APP_ID=1:277023675773:web:c6bede8cdf013671916814 \
  --build-arg VITE_FIREBASE_MEASUREMENT_ID=G-PQGKSH10SH \
  --build-arg VITE_BACKEND_URL=https://assignment-notifier-backend-xxxx.run.app \
  -t asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/navix-ai/assignment-notifier-frontend:latest \
  .

# Push
docker push asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/navix-ai/assignment-notifier-frontend:latest

# Deploy
gcloud run deploy assignment-notifier-frontend \
  --image=asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/navix-ai/assignment-notifier-frontend:latest \
  --region=asia-south1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5
```

---

## Option B — Cloud Build CI/CD Pipeline (Recommended)

The `cloudbuild.yaml` at the repo root automates both builds and deploys on every push.

### Set up the trigger:

```bash
gcloud beta builds triggers create github \
  --repo-name=YOUR_REPO_NAME \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=\
_REGION=asia-south1,\
_PROJECT_ID=YOUR_PROJECT_ID,\
_VITE_FIREBASE_API_KEY=AIzaSyBNys7JagJc3DCyeZ-KCen9Pg21AmeweoQ,\
_VITE_FIREBASE_AUTH_DOMAIN=college-management-syste-34d63.firebaseapp.com,\
_VITE_FIREBASE_PROJECT_ID=college-management-syste-34d63,\
_VITE_FIREBASE_STORAGE_BUCKET=college-management-syste-34d63.firebasestorage.app,\
_VITE_FIREBASE_MESSAGING_SENDER_ID=277023675773,\
_VITE_FIREBASE_APP_ID=1:277023675773:web:c6bede8cdf013671916814,\
_VITE_FIREBASE_MEASUREMENT_ID=G-PQGKSH10SH,\
_VITE_BACKEND_URL=https://assignment-notifier-backend-xxxx.run.app
```

> **Tip:** Store sensitive substitution values in Cloud Secret Manager and reference them
> as `secretEnv` in `cloudbuild.yaml` for better security.

---

## Option C — Local Docker Testing (Before Pushing)

Test the full stack locally before deploying:

```bash
# From the workspace root (where docker-compose.yml lives)
cd "Assignment notifier app"

# Start both services
docker compose up --build

# Frontend: http://localhost:8080
# Backend:  http://localhost:5000/health
```

---

## Verifying the Deployment

| Check | Command |
|---|---|
| Backend health | `curl https://YOUR_BACKEND_URL/health` |
| List Cloud Run services | `gcloud run services list --region=asia-south1` |
| View logs | `gcloud logging read "resource.type=cloud_run_revision" --limit=50` |

---

## ⚠️ Important Notes

| Topic | Detail |
|---|---|
| **Camera on Cloud Run** | Physical webcam is unavailable; `/video_feed` returns `503` gracefully |
| **File storage** | `captured_images/` and `attendance_records/` are **ephemeral** on Cloud Run. Data is lost on container restart. For persistence, migrate to **Firestore** or **Cloud Storage** |
| **Firebase config** | Env vars are baked into the frontend at build time by Vite. Keep them in Cloud Build substitutions, NOT in git |
| **Scaling** | Backend: max 3 instances (camera-aware); Frontend: max 5 instances |
| **Cold starts** | `min-instances=0` means ~1-2s cold start. Set to `1` to eliminate this |
