# 🛰️ SatLies — Project Blueprint

> **SatLies** - *where the satellite lies.*

> **Vision:** An end-to-end satellite mission simulator, planner, and tracker. A user defines a satellite, simulates its orbit, plans its mission, and sees when and where it's visible from Earth.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Modules](#2-core-modules)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [UI Structure](#5-ui-structure)
6. [Build Plan (Phases)](#6-build-plan-phases)
7. [Physics Reference](#7-physics-reference)
8. [Deployment & Deliverables](#8-deployment--deliverables)
9. [What This Demonstrates](#9-what-this-demonstrates)

---

## 1. Project Overview

This project is a full-stack web application that simulates orbital mechanics, plans satellite missions, and tracks ground visibility passes. It is designed to reflect the kind of tooling used in real satellite mission planning, implemented with clean modular architecture and accurate (but simplified) physics.

**Target audience:** Recruiters, engineers, and anyone curious about space systems engineering.

**End goal:** When someone sees this project, they should think:
> *"This person can simulate real-world orbital systems and build engineering tools around them."*

---

## 2. Core Modules

### Module 1 — Orbit Simulator (Core Engine)

The foundational physics module. Everything else depends on this.

**Inputs:**
- Altitude (km) or semi-major axis (km)
- Inclination (degrees)
- Eccentricity (0 = circular, <1 = elliptical)
- Initial position / true anomaly (degrees)
- Simulation duration (minutes/hours)

**Physics (incremental complexity):**

| Stage | Model | Description |
|-------|-------|-------------|
| Start | 2-body | Earth + satellite, point masses, Newton's law of gravitation |
| +1 | J2 perturbation | Earth's oblateness causing nodal precession |
| +2 | Atmospheric drag | Simplified exponential density model (LEO only) |

**Outputs:**
- Orbit path in 3D (x, y, z coordinates over time)
- Position and velocity vector at any time `t`
- Orbital period (T)
- Apogee / perigee altitude

---

### Module 2 — Mission Planner

Computes orbital maneuvers between two orbits.

**Inputs:**
- Start orbit (altitude or semi-major axis)
- Target orbit (altitude or semi-major axis)
- Specific impulse `Isp` (for fuel estimate)
- Spacecraft wet mass (kg)

**Computations:**
- Hohmann transfer trajectory (two-burn maneuver)
- Delta-V required for each burn (Δv₁, Δv₂, Δv_total)
- Transfer time (half of transfer orbit period)
- Fuel consumed (Tsiolkovsky rocket equation)

**Outputs:**
- Transfer ellipse trajectory (visualized)
- Delta-V budget (m/s)
- Estimated fuel mass (kg)
- Time to complete transfer

---

### Module 3 — Ground Station Tracker

Converts orbital data into Earth-surface visibility passes.

**Inputs:**
- Ground station latitude (degrees)
- Ground station longitude (degrees)
- Minimum elevation angle (degrees, default: 5°)

**Computations:**
- Transform ECI (Earth-Centered Inertial) → ECEF → local horizontal coordinates
- Calculate elevation and azimuth angles vs. time
- Detect horizon crossings (pass start/end times)
- Account for Earth rotation

**Outputs:**
- Next visible pass: time from now (minutes)
- Pass duration (seconds/minutes)
- Max elevation angle during pass
- Ground track line drawn over Earth

---

## 3. Tech Stack

```
Frontend          React (Vite)
3D Visualization  Three.js
2D Plots          Recharts or Plotly.js
Backend API       Python — FastAPI
Physics Engine    Python — NumPy, SciPy
Deployment        Frontend: Vercel / Netlify
                  Backend: Render / Railway / Fly.io
```

**Why this stack?**
- **Python** has best-in-class scientific libraries for numerical integration and orbital mechanics.
- **FastAPI** is async, fast, and auto-documents itself (Swagger UI included).
- **Three.js** handles 3D rendering in-browser with no plugin dependencies.
- **React** keeps the UI modular and state-driven.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │
│   │  Left Panel  │  │  Center View │  │ Right Panel │   │
│   │  (Inputs)    │  │  (Three.js)  │  │  (Outputs)  │   │
│   └──────┬───────┘  └──────┬───────┘  └──────┬──────┘   │
│          │                 │                 │          │
│          └─────────────────┼─────────────────┘          │
│                            │                            │
│                    React State / API                    │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP (REST / JSON)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                      │
│                                                         │
│   POST /simulate-orbit   → OrbitSimulator               │
│   POST /plan-mission     → MissionPlanner               │
│   POST /ground-track     → GroundStationTracker         │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  Physics Engine (Python)                │
│                                                         │
│   orbit_simulator.py     (NumPy / SciPy ODE solver)     │
│   mission_planner.py     (Hohmann transfer math)        │
│   ground_tracker.py      (ECI → ECEF → horizon)         │
│   perturbations.py       (J2, drag models)              │
└─────────────────────────────────────────────────────────┘
```

**Key design principle:** The physics engine is completely decoupled from the API and the UI. You could swap the frontend or run the engine standalone.

---

## 5. UI Structure

### Layout

```
┌──────────────┬──────────────────────────────┬───────────────┐
│  LEFT PANEL  │        CENTER (MAIN VIEW)    │  RIGHT PANEL  │
│              │                              │               │
│  Satellite   │     3D Earth + Orbit         │  Orbital Data │
│  Config      │        (Three.js)            │               │
│              │                              │  Period: Xs   │
│  Mission     │   ──────────────────────     │  Alt: Xkm     │
│  Config      │                              │  Inc: X°      │
│              │   Orbit animation            │               │
│  Ground Stn  │   Ground track line          │  Pass Timings │
│  Config      │   Maneuver visualization     │               │
│              │                              │  Δv Budget    │
│  [Simulate]  │                              │               │
│  [Plan]      │                              │  Mission ETA  │
└──────────────┴──────────────────────────────┴───────────────┘
```

### Input Controls (Left Panel)

**Satellite Configuration:**
- Altitude (km) — slider + text input
- Inclination (°) — slider (0–180)
- Eccentricity — slider (0–0.99)
- True Anomaly at epoch (°)

**Mission Configuration:**
- Target orbit altitude (km)
- Spacecraft mass (kg)
- Specific impulse Isp (s)

**Ground Station:**
- Latitude (°) — slider or map click
- Longitude (°) — slider or map click
- Min elevation angle (°)

---

## 6. Build Plan (Phases)

### ✅ Phase 1 — Circular Orbit (Foundation)
**Goal:** Satellite moves correctly over time.

- Implement 2-body equations of motion in Python
- Integrate with `scipy.integrate.solve_ivp`
- Plot orbit in 2D (x vs y in orbital plane)
- Return position array as JSON from FastAPI
- Display as a simple 2D canvas on frontend
- Verify orbital period matches: `T = 2π√(a³/μ)`

**Done when:** A circular orbit at 400 km plots correctly and the period matches ISS (~92 min).

---

### ✅ Phase 2 — Full Orbital Elements + Earth Rotation
**Goal:** Realistic orbit paths in 3D.

- Add inclination (rotate orbit plane)
- Add eccentricity (elliptical orbits)
- Integrate Three.js — render 3D Earth + orbit path
- Add Earth texture (day/night optional)
- Rotate Earth in sync with simulation time
- Show satellite as moving dot along the orbit

**Done when:** An ISS-like orbit (400 km, 51.6° inc) looks correct in 3D.

---

### ✅ Phase 3 — Ground Station Tracking
**Goal:** Show satellite passing over locations.

- Convert orbit ECI coordinates → geographic lat/lon over time
- Draw ground track on Earth surface (Three.js line)
- Accept ground station lat/lon input
- Compute elevation angle vs. time for that station
- Detect and report next visible pass (time + duration)
- Show pass window in the right panel

**Done when:** Given a ground station location, the app reports "Next pass in X min, duration Y min, max elevation Z°."

---

### ✅ Phase 4 — Mission Planner (Hohmann Transfer)
**Goal:** Show transfer orbit and delta-V.

- Implement Hohmann transfer calculator
- Compute Δv₁ (raise apogee), Δv₂ (circularize)
- Compute transfer orbit (semi-major axis = (r₁ + r₂) / 2)
- Compute fuel mass via Tsiolkovsky rocket equation
- Visualize all three orbits: initial, transfer ellipse, target
- Show delta-V breakdown in the right panel

**Done when:** A LEO → GEO transfer shows ~3.9 km/s total Δv.

---

### 🔬 Phase 5 — Advanced Physics (Optional)
**Goal:** Add real-world perturbations.

- **J2 perturbation:** Modify equations of motion with J2 term. Show RAAN drift over multiple orbits.
- **Atmospheric drag:** Simple exponential atmosphere model. Show orbit decay over days/weeks.
- Document all assumptions clearly in the write-up.

---

## 7. Physics Reference

### Orbital Period
```
T = 2π × √(a³ / μ)

where:
  a = semi-major axis (m)
  μ = GM_earth = 3.986 × 10¹⁴ m³/s²
```

### Circular Orbital Velocity
```
v = √(μ / r)
```

### Hohmann Transfer — Delta-V
```
Δv₁ = √(μ/r₁) × (√(2r₂/(r₁+r₂)) − 1)
Δv₂ = √(μ/r₂) × (1 − √(2r₁/(r₁+r₂)))
```

### Tsiolkovsky Rocket Equation (Fuel Estimate)
```
Δm = m₀ × (1 − e^(−Δv / (Isp × g₀)))

where:
  m₀  = initial (wet) mass (kg)
  Isp = specific impulse (s)
  g₀  = 9.80665 m/s²
```

### J2 Perturbation (RAAN Precession)
```
dΩ/dt = −(3/2) × n × J2 × (R_earth/a)² × cos(i) / (1−e²)²

where:
  J2 = 1.08263 × 10⁻³
  n  = mean motion
  i  = inclination
```

### Coordinate Conversion (ECI → Geographic)
- Rotate ECI frame by Greenwich Sidereal Time (GST) to get ECEF
- Convert ECEF (x, y, z) to geodetic lat/lon via standard formulas

---

## 8. Deployment & Deliverables

### Live App
- Frontend deployed to **Vercel** or **Netlify** (auto-deploy from GitHub)
- Backend deployed to **Render** or **Railway** (free tier fine for demo)
- Connect via environment variable: `VITE_API_URL=https://your-api.onrender.com`

### GitHub Repository Structure
```
satlies/
├── backend/
│   ├── main.py               # FastAPI app + routes
│   ├── orbit_simulator.py    # Core physics engine
│   ├── mission_planner.py    # Hohmann transfer
│   ├── ground_tracker.py     # Pass prediction
│   ├── perturbations.py      # J2, drag
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LeftPanel.jsx
│   │   │   ├── OrbitViewer.jsx   # Three.js canvas
│   │   │   └── RightPanel.jsx
│   │   ├── hooks/
│   │   │   └── useOrbitSimulation.js
│   │   └── App.jsx
│   └── package.json
├── docs/
│   └── write-up.md           # Physics + architecture + limitations
└── README.md
```

### Write-Up (docs/write-up.md)
The write-up must clearly explain:

1. **Physics:** Why orbits are elliptical (conservation of energy + angular momentum). How Hohmann transfers work. What J2 is and why it matters.
2. **Architecture:** Why the physics is in Python, why FastAPI, how data flows from engine → API → UI.
3. **Limitations:** Point-mass Earth, no solar pressure, no lunar gravity, simplified drag model, no TLE input (yet).
4. **Real-world relevance:** Reference to GMAT (NASA's General Mission Analysis Tool) and STK as the professional equivalents this simplifies.

---

## 9. What This Demonstrates

| Skill | Evidence |
|-------|----------|
| **Physics understanding** | Correct orbital mechanics, perturbation models, delta-V budgets |
| **Scientific computing** | NumPy/SciPy ODE integration, coordinate transforms |
| **Backend engineering** | Clean FastAPI service, modular Python packages |
| **Frontend engineering** | React state management, Three.js 3D rendering |
| **System design** | Decoupled modules — engine, API, UI are independently testable |
| **Communication** | Physics write-up that explains assumptions and limitations clearly |
| **Real-world relevance** | Tool reflects actual satellite mission planning workflows |

---

*SatLies — know where it lies.*