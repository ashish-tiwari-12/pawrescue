# 🏥 PawConnect India — Standalone NGO Platform Deployment Guide

This standalone package allows you to deploy the **PawConnect NGO Command HQ & Ambulance Dispatch Platform** independently (e.g. on `https://ngo.pawconnect.in` or Vercel/Netlify) while connecting seamlessly to your central PawConnect backend API.

---

## 🚀 Quick Local Development

1. **Navigate to the directory**:
   ```bash
   cd ngo-client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the NGO Platform dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🌐 Deploying to Vercel (Recommended)

1. Push this repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `ngo-client`.
5. In **Build & Output Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add **Environment Variables**:
   - `VITE_API_URL` = `https://your-production-backend.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://your-production-backend.onrender.com`
7. Click **Deploy**!

---

## ⚡ Deploying to Netlify

1. Log in to [Netlify](https://netlify.com) and select **"Add new site" > "Import an existing project"**.
2. Select your repository.
3. Configure Build Settings:
   - **Base directory**: `ngo-client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add Environment Variables under **Site configuration > Environment variables**:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://your-backend.onrender.com`
5. Click **Deploy site**.

---

## 🐳 Docker Deployment

To containerize the NGO platform with Nginx:

```dockerfile
# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Nginx Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t pawconnect-ngo-platform .
docker run -p 3001:80 pawconnect-ngo-platform
```

---

## 🛡️ Standalone Modules Included

| Module | Features Included |
| :--- | :--- |
| **🏠 Overview & Triage** | Live critical SOS alerts, active volunteer counters, and 1-click dispatch. |
| **📋 Rescues & Cases** | Status progression (Reported → Accepted → In Progress → Resolved), notes log, volunteer assignment. |
| **🗺️ Live Dispatch Map** | Leaflet map with shelter HQ pin, 5–50 KM radius zone circle, incident markers, and dynamic ambulance routing lines. |
| **🐕 National Dog Registry** | Centralized indie canine registry, photo uploads, medical diagnoses, ARV vaccination cards, ABC ear-notch logs. |
| **🤖 AI Visual Dog Matcher** | Side-by-side AI visual comparison drawer matching sightings against registered profiles (94% confidence scores). |
| **👥 Volunteers Roster** | Real-time availability tracking (`Available`, `On Mission`, `Off Duty`), phone contacts, and skills. |
| **📊 Operational Analytics** | Case resolution times, category breakdowns, monthly trends, and neighborhood distribution. |
| **🏛️ Municipal ARV / ABC** | Government-grade district heatmap displaying vaccination % and sterilization coverage rates. |
| **⚙️ Shelter Settings** | Configure operational radius (5/10/20/50 KM), supported services, and 24x7 readiness. |
