# SatLies — Physics, Architecture & Design Decisions

> *A write-up by a CS engineer who finds orbital mechanics genuinely fascinating.*

---

## What This Project Is

SatLies is a full-stack satellite mission simulator. You give it a satellite — defined by its orbit parameters — and it simulates where that satellite goes, how to move it to a different orbit, and when it will be visible from a spot on Earth.

The goal wasn't to build a toy. The professional tools that do this — NASA's GMAT, AGI's STK — are powerful but opaque. This project implements the same underlying physics from scratch, in plain Python, with every assumption documented. If you understand this code, you understand the core of how real mission planning works.

---

## Part 1 — The Physics

### Why do satellites orbit at all?

A satellite in orbit isn't floating — it's falling. It's falling towards Earth continuously, but it's also moving sideways so fast that the Earth curves away beneath it at the same rate it falls. It never hits the ground. This is what an orbit is.

The higher the orbit, the less gravitational pull, so the satellite moves slower. At ~400 km (the ISS), the orbital speed is about 7.7 km/s (~27,700 km/h) and one full orbit takes ~92 minutes. At geostationary altitude (~35,786 km), the speed drops to ~3.1 km/s and the period is exactly 24 hours — which is why GEO satellites appear stationary over a fixed point on Earth.

### Orbital Elements — Describing an Orbit

An orbit isn't just a circle. It's described by six numbers called **orbital elements**:

| Element | What it means |
|---|---|
| **Semi-major axis / Altitude** | The size of the orbit — how far from Earth |
| **Eccentricity** | The shape — 0 is a perfect circle, closer to 1 is a stretched ellipse |
| **Inclination** | The tilt — 0° orbits the equator, 90° goes pole-to-pole |
| **RAAN** | Right Ascension of Ascending Node — rotates the orbital plane around Earth's axis |
| **Argument of Perigee** | Rotates the ellipse within its plane |
| **True Anomaly** | Where in the orbit the satellite currently is |

These six numbers uniquely describe any orbit. SatLies converts them into a position and velocity vector in 3D space using the standard perifocal-to-ECI rotation, then hands that off to the physics engine.

### The Physics Engine — Two-Body Problem

The core of the simulator is Newton's law of gravitation applied to two bodies: Earth and the satellite.

The gravitational acceleration on the satellite at any moment is:

```
a = −(μ / r³) × r_vec
```

Where `μ = GM_earth = 3.986 × 10¹⁴ m³/s²` is Earth's gravitational parameter and `r` is the distance from Earth's centre. This gives us a simple differential equation: given position and velocity right now, compute acceleration, which tells us how velocity changes, which tells us how position changes.

We integrate this over time using **SciPy's `solve_ivp`** with a **Runge-Kutta RK45** solver. RK45 is an adaptive-step numerical integrator — it automatically takes smaller steps when the trajectory is curving sharply and larger steps when it's coasting, keeping error within tight tolerances (`rtol=1e-9`, `atol=1e-9`). This is exactly the kind of integrator used in real astrodynamics software.

The result is a time series of [x, y, z] positions in the **ECI frame** (Earth-Centred Inertial) — a coordinate system fixed to the stars, not rotating with Earth.

### J2 Perturbation — Earth Isn't a Perfect Sphere

A real satellite doesn't follow a perfect ellipse forever. Earth is slightly squashed at the poles and bulgy at the equator — its equatorial radius is ~21 km larger than its polar radius. This asymmetry exerts a small extra gravitational force that causes the orbital plane to slowly rotate around Earth's axis. This is called **nodal precession**.

The dominant term of this effect is captured by the **J2 coefficient** (`J2 = 1.08263 × 10⁻³`). The correction to the equations of motion is:

```
a_J2 = (3/2) × J2 × μ × R_earth² / r⁵ × [x(5z²/r² − 1), y(5z²/r² − 1), z(5z²/r² − 3)]
```

This is added directly to the two-body acceleration before each integration step. Sun-synchronous orbits (SSO, ~97.4° inclination) deliberately use this precession — they're inclined at just the right angle so J2 makes the orbit precess at the same rate as Earth orbits the Sun, keeping the satellite always crossing the equator at the same local solar time.

### Ground Track — From Space to Earth

The orbit simulator works in ECI coordinates, which are fixed relative to the stars. But the Earth is rotating underneath. To find where the satellite is over the ground, we have to convert.

At any time `t`, Earth has rotated by `θ = ω_earth × t` since the simulation started (`ω_earth = 7.292 × 10⁻⁵ rad/s`). We rotate the satellite's ECI position by this angle to get **ECEF coordinates** (Earth-Centred, Earth-Fixed — a frame that rotates with Earth). Then standard spherical geometry converts [x, y, z] ECEF into latitude, longitude, and altitude.

The ground track you see drawn on the globe is this conversion applied to every point in the orbit.

### Ground Station Passes — When Can You Talk to It?

A ground station can only communicate with a satellite when it's above the horizon — specifically, above a minimum elevation angle (typically 5°) to avoid signal degradation from the atmosphere.

For each point in the orbit, the code:
1. Converts the satellite's ECI position to ECEF (as above)
2. Computes the range vector from the ground station to the satellite
3. Projects that range vector onto the local **ENZ frame** (East, North, Zenith) at the ground station
4. Computes elevation angle: `el = arcsin(ρ_zenith / |ρ|)`

A **pass** is a contiguous window where elevation stays above the minimum threshold. The code scans through the time series, detects rising and setting crossings, and reports each pass with start time, duration, and maximum elevation.

### Mission Planner — Moving Between Orbits

To change orbits, you have to fire a rocket engine — this changes the satellite's velocity. The most fuel-efficient way to move between two circular orbits is a **Hohmann transfer**: two short burns with a coasting ellipse in between.

**Burn 1** happens at the lower orbit. You fire the engine *in the direction of travel* (prograde), which raises the opposite side of the orbit (the apogee) up to the target altitude. The satellite is now in an elliptical transfer orbit.

**Burn 2** happens half an orbit later, at the apogee of the transfer ellipse. You fire again prograde, which circularises the orbit at the new altitude.

The delta-V for each burn comes from the **vis-viva equation**, which relates orbital speed to position:

```
v = √(μ × (2/r − 1/a))
```

- `Δv₁ = v_transfer_perigee − v_circular_low`
- `Δv₂ = v_circular_high − v_transfer_apogee`

A LEO → GEO transfer (400 km to 35,786 km) requires about 3.9 km/s total delta-V. That's why getting to GEO is expensive — it's not just the altitude, it's the enormous speed difference.

**Fuel consumed** is calculated using the **Tsiolkovsky rocket equation**:

```
Δm = m₀ × (1 − e^(−Δv / (Isp × g₀)))
```

`Isp` (specific impulse) measures engine efficiency in seconds — a chemical rocket might be 300s, an ion thruster can exceed 3000s. Higher Isp means less fuel for the same delta-V, which is why ion thrusters are used for long missions despite their low thrust.

---

## Part 2 — Architecture

### Why Python for the physics?

Python has NumPy and SciPy, which are best-in-class for numerical computing. SciPy's `solve_ivp` is a production-grade ODE solver. Writing an equivalent from scratch in JavaScript would be both harder and slower. The physics layer is also completely independent of the web layer — you can import and run `simulate_orbit()` from a script, a notebook, or a test without any web framework involved.

### Why FastAPI?

FastAPI is fast, async, and automatically generates a Swagger UI at `/docs` — which means anyone can test the API endpoints directly without needing the frontend. It also uses Pydantic for request validation, so malformed inputs are rejected with clear error messages before they touch the physics code.

### How data flows

```
User adjusts sliders → React state (Zustand)
                     → POST request (axios) to FastAPI
                     → Pydantic validates the request
                     → Physics engine runs (NumPy / SciPy)
                     → JSON response (positions, times, pass windows)
                     → Three.js renders the orbit in 3D
                     → Recharts renders the charts
```

The physics engine has no knowledge of HTTP. The API routers have no knowledge of physics — they just translate HTTP requests into dataclass inputs and pass results back. This separation means each layer is independently testable.

### Coordinate Systems

Three different coordinate frames are used and it matters to keep them straight:

- **ECI (Earth-Centred Inertial):** Origin at Earth's centre, axes fixed to distant stars. This is where the orbital integration happens — Newton's laws are valid in this inertial frame.
- **ECEF (Earth-Centred, Earth-Fixed):** Same origin, but axes rotate with Earth. Used for converting to lat/lon and for ground station calculations.
- **ENZ (East-North-Zenith):** Local frame at the ground station. Used to compute elevation and azimuth angles for pass prediction.

---

## Part 3 — Limitations & Honest Assumptions

This simulator gets the important physics right, but it makes simplifications that a production mission planning tool would not. These are all documented deliberately.

**Point-mass Earth (beyond J2):** The physics engine models Earth as a point mass plus the J2 oblateness correction. In reality, Earth's gravity field has hundreds of harmonic terms (J3, J4, tesseral harmonics...) that cause additional slow perturbations. These matter for precision station-keeping but are negligible for demonstration purposes.

**No atmospheric drag:** The atmosphere doesn't end sharply — it thins exponentially with altitude. Below ~600 km, atmospheric drag gradually decelerates satellites, causing orbits to decay over months or years. This isn't implemented. The ISS, for reference, has to reboost its orbit several times per year because of drag.

**No solar radiation pressure:** Photons from the Sun carry momentum. For large, low-mass satellites (like those with big solar panels), radiation pressure causes measurable perturbations. Not modelled here.

**No third-body gravity:** The Moon and Sun both exert gravitational forces on satellites, especially in high orbits (GEO and beyond). Not modelled here.

**Circular initial and target orbits (Mission Planner):** The Hohmann transfer assumes both the start and end orbits are circular. Transfers between elliptical orbits require more complex bi-elliptic or general maneuver planning.

**No TLE input (yet):** Real satellite tracking uses Two-Line Element sets (TLEs) published by NORAD, which encode the current orbital state of every tracked object in space. SatLies currently requires manual input of orbital elements rather than accepting TLE strings directly.

---

## Part 4 — Real-World Relevance

The professional tools that do what SatLies does are **GMAT** (NASA's General Mission Analysis Tool, open source) and **STK** (Systems Tool Kit, by Ansys — used by most aerospace companies and agencies). Both use the same underlying physics: numerical ODE integration, the same coordinate transforms, the same Hohmann transfer math.

The physics in SatLies is deliberately the same. The difference is that GMAT and STK model hundreds of perturbation terms, support TLE import, handle non-impulsive maneuvers, and have been validated against real flight data for decades. SatLies models the dominant effects and is honest about what it leaves out.

The goal of this project was never to replace those tools. It was to understand them from the inside — to build something that computes real numbers for real physics, rather than wrapping a black-box library and calling it done.

---

*SatLies — know where it lies.*