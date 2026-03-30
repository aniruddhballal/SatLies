import numpy as np
from typing import List
from dataclasses import dataclass

R_EARTH = 6_371_000.0
OMEGA_EARTH = 7.2921150e-5  # rad/s


@dataclass
class GroundStation:
    lat_deg: float
    lon_deg: float
    min_elevation_deg: float = 5.0
    name: str = "Ground Station"


def compute_passes(
    positions_km: List[List[float]],
    times_s: List[float],
    station: GroundStation,
) -> dict:
    """
    Given ECI orbit positions and a ground station,
    compute elevation angles and detect visible passes.
    """
    lat = np.radians(station.lat_deg)
    lon_gs = np.radians(station.lon_deg)
    min_el = np.radians(station.min_elevation_deg)

    elevations = []
    azimuths = []

    # Ground station ECEF position (static — doesn't rotate with Earth here;
    # we rotate the satellite into ECEF instead)
    x_gs = R_EARTH * np.cos(lat) * np.cos(lon_gs)
    y_gs = R_EARTH * np.cos(lat) * np.sin(lon_gs)
    z_gs = R_EARTH * np.sin(lat)
    gs_ecef = np.array([x_gs, y_gs, z_gs])

    for pos_km, t in zip(positions_km, times_s):
        x, y, z = [p * 1000 for p in pos_km]

        # ECI → ECEF (rotate by Earth's rotation angle)
        theta = OMEGA_EARTH * t
        x_ecef = x * np.cos(theta) + y * np.sin(theta)
        y_ecef = -x * np.sin(theta) + y * np.cos(theta)
        z_ecef = z

        sat_ecef = np.array([x_ecef, y_ecef, z_ecef])

        # Range vector from ground station to satellite
        rho = sat_ecef - gs_ecef
        rho_mag = np.linalg.norm(rho)

        # Local unit vectors at ground station (SEZ or ENZ frame)
        # Using ENZ: East, North, Zenith
        sin_lat, cos_lat = np.sin(lat), np.cos(lat)
        sin_lon, cos_lon = np.sin(lon_gs), np.cos(lon_gs)

        e_east   = np.array([-sin_lon, cos_lon, 0])
        e_north  = np.array([-sin_lat * cos_lon, -sin_lat * sin_lon, cos_lat])
        e_zenith = np.array([ cos_lat * cos_lon,  cos_lat * sin_lon, sin_lat])

        rho_e = np.dot(rho, e_east)
        rho_n = np.dot(rho, e_north)
        rho_z = np.dot(rho, e_zenith)

        elevation = np.arcsin(rho_z / rho_mag)
        azimuth = np.arctan2(rho_e, rho_n) % (2 * np.pi)

        elevations.append(float(np.degrees(elevation)))
        azimuths.append(float(np.degrees(azimuth)))

    # Detect passes (contiguous windows above min elevation)
    passes = []
    in_pass = False
    pass_start = None
    max_el = -90.0

    for i, el in enumerate(elevations):
        if el >= station.min_elevation_deg:
            if not in_pass:
                in_pass = True
                pass_start = i
                max_el = el
            else:
                max_el = max(max_el, el)
        else:
            if in_pass:
                in_pass = False
                pass_end = i - 1
                t_start = times_s[pass_start]
                t_end = times_s[pass_end]
                passes.append({
                    "start_s": round(t_start, 1),
                    "end_s": round(t_end, 1),
                    "duration_s": round(t_end - t_start, 1),
                    "duration_min": round((t_end - t_start) / 60, 2),
                    "max_elevation_deg": round(max_el, 2),
                    "start_min": round(t_start / 60, 2),
                })
                max_el = -90.0

    # Close open pass at end of simulation
    if in_pass:
        t_start = times_s[pass_start]
        t_end = times_s[-1]
        passes.append({
            "start_s": round(t_start, 1),
            "end_s": round(t_end, 1),
            "duration_s": round(t_end - t_start, 1),
            "duration_min": round((t_end - t_start) / 60, 2),
            "max_elevation_deg": round(max_el, 2),
            "start_min": round(t_start / 60, 2),
        })

    return {
        "elevations_deg": elevations,
        "azimuths_deg": azimuths,
        "passes": passes,
        "num_passes": len(passes),
        "next_pass": passes[0] if passes else None,
    }