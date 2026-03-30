import numpy as np
from dataclasses import dataclass

MU = 3.986004418e14   # m^3/s^2
R_EARTH = 6_371_000.0  # m
G0 = 9.80665           # m/s^2 — standard gravity


@dataclass
class ManeuverRequest:
    initial_altitude_km: float
    target_altitude_km: float
    spacecraft_mass_kg: float = 1000.0
    isp_s: float = 300.0  # specific impulse in seconds


def hohmann_transfer(req: ManeuverRequest) -> dict:
    """
    Compute a Hohmann transfer between two circular orbits.

    Returns delta-V, transfer time, fuel mass, and transfer orbit data.
    """
    r1 = R_EARTH + req.initial_altitude_km * 1000  # m
    r2 = R_EARTH + req.target_altitude_km * 1000   # m

    # Velocities of circular orbits
    v1 = np.sqrt(MU / r1)
    v2 = np.sqrt(MU / r2)

    # Semi-major axis of transfer ellipse
    a_transfer = (r1 + r2) / 2

    # Velocities at transfer orbit endpoints
    v_transfer_perigee = np.sqrt(MU * (2 / r1 - 1 / a_transfer))
    v_transfer_apogee = np.sqrt(MU * (2 / r2 - 1 / a_transfer))

    # Delta-V burns
    dv1 = abs(v_transfer_perigee - v1)  # first burn (raise apogee)
    dv2 = abs(v2 - v_transfer_apogee)  # second burn (circularize)
    dv_total = dv1 + dv2

    # Transfer time (half the period of transfer ellipse)
    period_transfer = 2 * np.pi * np.sqrt(a_transfer**3 / MU)
    transfer_time_s = period_transfer / 2

    # Tsiolkovsky rocket equation for fuel mass
    # Δm = m0 * (1 - e^(-Δv / (Isp * g0)))
    exhaust_velocity = req.isp_s * G0
    fuel_mass_kg = req.spacecraft_mass_kg * (1 - np.exp(-dv_total / exhaust_velocity))

    # Transfer orbit points (for visualization)
    # Parametric ellipse in the transfer plane
    num_pts = 200
    # True anomaly from 0 (perigee) to π (apogee)
    nu_arr = np.linspace(0, np.pi, num_pts)
    e_transfer = (r2 - r1) / (r2 + r1)
    p = a_transfer * (1 - e_transfer**2)
    r_arr = p / (1 + e_transfer * np.cos(nu_arr))
    x_arr = (r_arr * np.cos(nu_arr) / 1000).tolist()
    y_arr = (r_arr * np.sin(nu_arr) / 1000).tolist()
    z_arr = [0.0] * num_pts

    transfer_points = [[x, y, z] for x, y, z in zip(x_arr, y_arr, z_arr)]

    return {
        "dv1_ms": round(dv1, 2),
        "dv2_ms": round(dv2, 2),
        "dv_total_ms": round(dv_total, 2),
        "transfer_time_s": round(transfer_time_s, 2),
        "transfer_time_min": round(transfer_time_s / 60, 2),
        "transfer_time_h": round(transfer_time_s / 3600, 4),
        "fuel_mass_kg": round(fuel_mass_kg, 3),
        "initial_velocity_ms": round(v1, 2),
        "target_velocity_ms": round(v2, 2),
        "transfer_apogee_km": round((r2 - R_EARTH) / 1000, 2),
        "transfer_perigee_km": round((r1 - R_EARTH) / 1000, 2),
        "transfer_semi_major_axis_km": round(a_transfer / 1000, 2),
        "eccentricity_transfer": round(e_transfer, 6),
        "transfer_points": transfer_points,
    }