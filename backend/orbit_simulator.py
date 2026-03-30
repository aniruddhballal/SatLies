import numpy as np
from scipy.integrate import solve_ivp
from dataclasses import dataclass
from typing import List, Tuple

# Earth constants
MU = 3.986004418e14       # m^3/s^2 — standard gravitational parameter
R_EARTH = 6_371_000.0     # m — mean Earth radius
J2 = 1.08263e-3           # Earth's second zonal harmonic
OMEGA_EARTH = 7.2921150e-5  # rad/s — Earth rotation rate


@dataclass
class OrbitalElements:
    altitude_km: float        # km above Earth surface
    inclination_deg: float    # degrees
    eccentricity: float       # 0 = circular
    raan_deg: float = 0.0     # Right Ascension of Ascending Node (degrees)
    arg_perigee_deg: float = 0.0  # Argument of perigee (degrees)
    true_anomaly_deg: float = 0.0  # Initial true anomaly (degrees)


def elements_to_state_vector(el: OrbitalElements) -> Tuple[np.ndarray, np.ndarray]:
    """Convert orbital elements to ECI position and velocity vectors."""
    a = (R_EARTH + el.altitude_km * 1000)  # semi-major axis in meters
    e = el.eccentricity
    i = np.radians(el.inclination_deg)
    raan = np.radians(el.raan_deg)
    omega = np.radians(el.arg_perigee_deg)
    nu = np.radians(el.true_anomaly_deg)

    # Distance from focus
    r = a * (1 - e**2) / (1 + e * np.cos(nu))

    # Position in perifocal frame
    r_pqw = np.array([r * np.cos(nu), r * np.sin(nu), 0.0])

    # Velocity in perifocal frame
    p = a * (1 - e**2)
    v_pqw = np.array([
        -np.sqrt(MU / p) * np.sin(nu),
         np.sqrt(MU / p) * (e + np.cos(nu)),
         0.0
    ])

    # Rotation matrix: perifocal → ECI
    def R3(angle): return np.array([
        [ np.cos(angle), np.sin(angle), 0],
        [-np.sin(angle), np.cos(angle), 0],
        [0, 0, 1]
    ])
    def R1(angle): return np.array([
        [1, 0, 0],
        [0,  np.cos(angle), np.sin(angle)],
        [0, -np.sin(angle), np.cos(angle)]
    ])

    Q = R3(raan).T @ R1(i).T @ R3(omega).T

    r_eci = Q @ r_pqw
    v_eci = Q @ v_pqw

    return r_eci, v_eci


def two_body_ode(t: float, y: np.ndarray) -> np.ndarray:
    """Two-body equations of motion."""
    r_vec = y[:3]
    v_vec = y[3:]
    r = np.linalg.norm(r_vec)
    a_vec = -MU / r**3 * r_vec
    return np.concatenate([v_vec, a_vec])


def two_body_j2_ode(t: float, y: np.ndarray) -> np.ndarray:
    """Two-body + J2 perturbation equations of motion."""
    r_vec = y[:3]
    v_vec = y[3:]
    r = np.linalg.norm(r_vec)
    x, y_c, z = r_vec

    # Two-body acceleration
    a_2body = -MU / r**3 * r_vec

    # J2 perturbation
    factor = (3/2) * J2 * MU * R_EARTH**2 / r**5
    a_j2 = factor * np.array([
        x * (5 * z**2 / r**2 - 1),
        y_c * (5 * z**2 / r**2 - 1),
        z * (5 * z**2 / r**2 - 3),
    ])

    a_total = a_2body + a_j2
    return np.concatenate([v_vec, a_total])


def simulate_orbit(
    elements: OrbitalElements,
    duration_s: float = None,
    num_periods: float = 1.0,
    num_points: int = 500,
    use_j2: bool = False,
) -> dict:
    """
    Simulate an orbit and return position data over time.

    Returns a dict with:
        - positions: list of [x, y, z] in km
        - times: list of time values in seconds
        - period_s: orbital period in seconds
        - orbital_elements: summary
    """
    a = R_EARTH + elements.altitude_km * 1000  # meters
    period = 2 * np.pi * np.sqrt(a**3 / MU)   # seconds

    if duration_s is None:
        duration_s = num_periods * period

    r0, v0 = elements_to_state_vector(elements)
    y0 = np.concatenate([r0, v0])

    t_span = (0, duration_s)
    t_eval = np.linspace(0, duration_s, num_points)

    ode_func = two_body_j2_ode if use_j2 else two_body_ode

    sol = solve_ivp(
        ode_func,
        t_span,
        y0,
        t_eval=t_eval,
        method="RK45",
        rtol=1e-9,
        atol=1e-9,
    )

    positions_km = (sol.y[:3].T / 1000).tolist()  # convert to km
    times = sol.t.tolist()

    # Compute apogee/perigee from position magnitudes
    radii = np.linalg.norm(sol.y[:3], axis=0)
    apogee_km = (radii.max() - R_EARTH) / 1000
    perigee_km = (radii.min() - R_EARTH) / 1000

    return {
        "positions": positions_km,
        "times": times,
        "period_s": round(period, 2),
        "period_min": round(period / 60, 2),
        "apogee_km": round(apogee_km, 2),
        "perigee_km": round(perigee_km, 2),
        "semi_major_axis_km": round(a / 1000, 2),
        "num_points": len(times),
    }


def eci_to_geographic(positions_km: List[List[float]], times_s: List[float]) -> List[dict]:
    """
    Convert ECI positions to geographic lat/lon/alt over time.
    Accounts for Earth's rotation.
    """
    results = []
    for pos, t in zip(positions_km, times_s):
        x, y, z = [p * 1000 for p in pos]  # back to meters

        # Rotate by Earth's rotation angle
        theta = OMEGA_EARTH * t
        x_ecef = x * np.cos(theta) + y * np.sin(theta)
        y_ecef = -x * np.sin(theta) + y * np.cos(theta)
        z_ecef = z

        r = np.sqrt(x_ecef**2 + y_ecef**2 + z_ecef**2)
        lat = np.degrees(np.arcsin(z_ecef / r))
        lon = np.degrees(np.arctan2(y_ecef, x_ecef))
        alt_km = (r - R_EARTH) / 1000

        results.append({"lat": round(lat, 4), "lon": round(lon, 4), "alt_km": round(alt_km, 2)})

    return results