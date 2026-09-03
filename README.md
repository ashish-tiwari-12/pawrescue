# PawRescue (PawConnect India) 🐾

A production-ready full-stack MERN platform that connects compassionate citizens with animal welfare NGOs for reporting, triage, volunteer dispatch, and real-time tracking of stray dog rescue cases across India.

## 🚀 Key Features

### 1. Citizen Portal
- **Emergency Sighting Report**: Category selection (Injured Dog, Sick Dog, Aggressive Dog, Abandoned Puppy, Emergency Rescue, Sterilization, Vaccination), symptom tags, GPS geolocation pin, and photo uploads.
- **Real-Time Tracking**: Track complaint lifecycle with unique Tracking IDs (`PC-2026-XXXX`) or phone number, 4-stage visual progress stepper, assigned volunteer information, and activity audit timeline.
- **Citizen Dashboard**: Personal report history, status filters, and community impact badges.
- **1-Click Demo Logins**: Instant preview for Citizen, NGO Admin, and Volunteer roles.

### 2. NGO Dashboard
- **Triage & Dispatch Control Center**: Real-time KPI metrics (Total, Pending, In Progress, Resolved, Critical Cases), resolution rates, and live emergency queue.
- **Complaint Management Table**: Multi-criteria filters (status, category, priority, keyword search), sorting, pagination, and bulk status updates.
- **Case Inspection Modal**: Detailed incident breakdown, photo zoom gallery, GPS coordinates, volunteer assignment dropdown, and internal clinical notes timeline.
- **Volunteer Management**: Roster grid with live availability toggles (*Available*, *On Mission*, *Off Duty*), workload counters, and responder addition.
- **Analytics & Trends**: Interactive charts for monthly complaints vs resolutions, category distribution, and regional hotspot analytics.

### 3. Backend & Real-Time Engine
- **RESTful API**: Node.js + Express.js + Mongoose with role-based access control (`citizen`, `ngo_admin`, `volunteer`) and Multer file upload handling.
- **Database**: MongoDB Atlas cluster (`pawrescue`) with auto-seeding for verified NGOs and initial cases.
- **Real-Time WebSockets**: Socket.io live broadcasts for complaint creation, status transitions, volunteer assignments, and urgent alerts.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Material Symbols, Lucide Icons, Motion, Axios, Socket.io-client
- **Backend**: Node.js, Express.js, MongoDB Atlas, Mongoose, Socket.io, JWT Authentication, Multer, Bcrypt.js

---

## 🏁 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ashish-tiwari-12/pawrescue.git
cd pawrescue
npm install --prefix client
npm install --prefix server
```

### 2. Configure Environment
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.jahyc.mongodb.net/pawrescue?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_key
```

### 3. Run Locally
```bash
# Start backend (Port 5000)
npm run dev --prefix server

# Start frontend (Port 3000)
npm run dev --prefix client
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
