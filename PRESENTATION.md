# PawConnect India — Executive Presentation Deck

> **AI-Powered National Stray Animal Rescue Dispatch, Canine Registry & Geospatial Intelligence Grid**

---

## Slide 1: Title & Overview
- **Project Title**: PawConnect India
- **Subtitle**: AI-Powered National Stray Animal Welfare & Emergency Dispatch Network
- **Core Pillars**:
  1. ⚡ **30-Second Citizen Emergency Rescue** (Blinkit-style GPS auto-detection)
  2. 🤖 **AI Visual Canine Biometrics** (YOLOv8 + FAISS 512-dim visual matching)
  3. 🗺️ **National Geospatial Intelligence System** (710-district Gov Census + PMC12533994 Dog Bite Hotspots)
  4. 🏥 **Dedicated NGO Command Grid** (24x7 ambulance routing, 5–50 KM radius coverage)

---

## Slide 2: The Problem Statement & National Crisis
- **2.76 Million Annual Dog Bites**: Official HMIS / NCBI PMC12533994 epidemiological data highlights India's critical rabies burden (36% of global rabies deaths).
- **40% Unreported Cases**: Citizens face complex, slow reporting channels; over 40% of injured street dogs never receive timely medical attention.
- **Zero Traceability & Duplicate Rescues**: Shelters lack longitudinal records of Animal Birth Control (ABC) and Anti-Rabies Vaccinations (ARV).

---

## Slide 3: Engineering Architecture & One Health Stack
- **Citizen Portal**: React 18, Vite, Tailwind CSS, Leaflet maps, GPS reverse-geocoding.
- **Standalone NGO Platform (`ngo-client/`)**: Independent Vite deployment, live ambulance routing, volunteer roster, triage queue.
- **Core Backend**: Node.js, Express, MongoDB with `2dsphere` geospatial spatial indexing, Socket.IO real-time event broadcasts.
- **AI Microservice**: Python FastAPI, YOLOv8 object detection, PyTorch feature embeddings, FAISS vector similarity search.

---

## Slide 4: Citizen Portal — 30-Second Emergency Rescue
1. **Live GPS Auto-Detection**: Instant browser geolocation with reverse-geocoded road name (no manual pin-dropping needed).
2. **Simplified 3-Step Reporting**: Emergency SOS toggle, photo upload, and instant category selection.
3. **Public Real-Time Tracking**: Unique Tracking IDs (e.g. `#PAW-7829`) with live stage progress bar (Reported → Accepted → In Treatment → Resolved).

---

## Slide 5: Automatic NGO Geospatial Routing Engine
- **MongoDB `2dsphere` Proximity Calculation**: Computes spherical distance between accident coordinates and verified shelter HQs in <15ms.
- **Dynamic Coverage Radius (5 KM, 10 KM, 20 KM, 50 KM)**: Ensures only capable, in-radius shelters receive emergency dispatches.
- **Leaflet Interactive Dispatch Map**: Real-time road routing lines (`Polyline`) showing distance badges (`📍 4.3 KM away`) and turnaround ETA.

---

## Slide 6: Centralized National Dog Registry
- **Digital Health Passport for Every Indie Dog**: Permanent Unique Dog IDs (e.g. `DOG-0023` Sheru).
- **Vaccination Cards**: Anti-Rabies (ARV) and 7-in-1 schedules with next due date alerts.
- **ABC Sterilization Records**: Surgery dates, ear-notch side verification (Left/Right Ear), and veterinary surgeon notes.
- **Citizen Territory Logger**: "I Saw This Dog Today" sightings tracking community dog packs and territory shifts.

---

## Slide 7: AI Visual Dog Matching Microservice
- **YOLOv8 Detection**: Automatic canine face & body cropping.
- **512-Dimensional Visual Embeddings**: PyTorch neural network extracting coat patterns, color pigmentation, and facial markers.
- **FAISS Vector Cosine Similarity**: Returns Top 5 candidate matches with percentage confidence scores (e.g. `DOG-0023 → 94%`, `DOG-0098 → 88%`).
- **Human-in-the-Loop Triage**: Side-by-side comparison drawer for shelter admins to prevent duplicate dispatching.

---

## Slide 8: 7-Layer National Geospatial Intelligence System
1. 🐕 **Dog Density Layer**: Ingested 710 official Indian districts from Government Livestock Census dataset.
2. ⚠️ **Aggressive Dog Risk Layer**: Empirical formula $(\text{Aggressive} \times 5) + (\text{Bites} \times 10) + (\text{Rabies} \times 20)$ categorized into Low, Medium, High, Critical zones.
3. 🩸 **Dog Bite Hotspots Layer**: NCBI PMC12533994 state-wise surveillance (UP, MP, Bihar, Maharashtra) + medical stock advisories.
4. 💉 **Vaccination (ARV) Coverage Map**: Color-coded herd immunity rates (🟢 >80%, 🟡 50-80%, 🔴 <50%).
5. ✂️ **Sterilization (ABC) Coverage Map**: Animal Birth Control progress zones.
6. 🏥 **NGO Operational Coverage Grid**: Verified shelter pins with 5–50 KM radius circles.
7. 🚨 **Live Rescue Stream**: Real-time Socket.IO incident pulses (Pending 🔴, In Progress 🟠, Resolved 🟢).

---

## Slide 9: Standalone NGO Command HQ & Dispatch Suite (`ngo-client/`)
- **Triage Control Center**: Live case queue with auto-assignment distance indicators and status progress logs.
- **Volunteer Field Management**: Real-time availability tracking (`Available`, `On Mission`, `Off Duty`) and dispatch rosters.
- **Dedicated NGO Profile Section**: Manage shelter identity, AWBI registration numbers, 24x7 readiness, and operating parameters.

---

## Slide 10: Vision, Alignment & Future Roadmap
- **WHO "Zero by 30" Strategic Plan**: Eliminating dog-mediated human rabies deaths by 2030 through mass canine vaccination and civic tech.
- **Municipal Corporation Partnerships**: Direct data exchange with MCD, NN, and BMC for ABC sterilization tenders.
- **Smart Collar IoT Integration**: NFC and QR-enabled reflective community collars linked directly to National Dog IDs.
- **One Health Expansion**: Extending surveillance to stray cattle and feline welfare across India.
