# 🛰️ SatLies

> *where the satellite lies*

A full-stack satellite mission simulator. Define a satellite, simulate its orbit, plan a transfer maneuver, and find out when it's visible from anywhere on Earth — all backed by real orbital mechanics.

**[Live Demo →](https://your-frontend-url.vercel.app)** &nbsp;|&nbsp; **[API Docs →](https://your-backend-url.onrender.com/docs)**

![SatLies screenshot](docs/screenshot.png)

---

## What it does

- **Orbit Simulator** — numerically integrates the equations of motion (RK45) with optional J2 oblateness perturbation. Renders the orbit and ground track on a 3D Earth in real time.
- **Mission Planner** — computes a Hohmann transfer between two circular orbits. Shows delta-V budget, transfer ellipse, and fuel consumed via the Tsiolkovsky rocket equation.
- **Ground Station Tracker** — predicts satellite passes over any location on Earth. Reports next pass time, duration, and maximum elevation angle.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript |
| 3D Rendering | Three.js (`@react-three/fiber`) |
| Charts | Recharts |
| Backend | Python + FastAPI |
| Physics | NumPy + SciPy (`solve_ivp`) |
| State | Zustand |

---

## Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Then open `http://localhost:5173`.

---

## Physics

The simulator uses real astrodynamics — two-body Newtonian gravity, J2 perturbation, ECI→ECEF coordinate transforms, and Hohmann transfer math. All assumptions and limitations are documented in [`write-up.md`](write-up.md).

---

## Project Structure

```
satlies/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── orbit_simulator.py      # Core physics engine
│   ├── mission_planner.py      # Hohmann transfer
│   ├── ground_tracker.py       # Pass prediction
│   ├── routers/
│   │   ├── orbit.py
│   │   ├── mission.py
│   │   └── ground.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── LeftPanel.tsx
│       │   ├── OrbitViewer.tsx
│       │   └── RightPanel.tsx
│       ├── store/useStore.ts
│       ├── lib/api.ts
│       └── App.tsx
└── docs/
    └── write-up.md
```

---

*Built by a CS engineer who finds orbital mechanics genuinely fascinating.*