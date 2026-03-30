from fastapi import APIRouter
from pydantic import BaseModel, Field
from ground_tracker import GroundStation, compute_passes
from orbit_simulator import OrbitalElements, simulate_orbit

router = APIRouter()


class GroundTrackRequest(BaseModel):
    # Orbit params
    altitude_km: float = Field(400.0, ge=160, le=40_000)
    inclination_deg: float = Field(51.6, ge=0, le=180)
    eccentricity: float = Field(0.0, ge=0, lt=1)
    raan_deg: float = 0.0
    arg_perigee_deg: float = 0.0
    true_anomaly_deg: float = 0.0
    num_periods: float = Field(3.0, ge=1, le=20)
    num_points: int = Field(1000, ge=200, le=3000)
    use_j2: bool = False  # was missing — J2 toggle now wired through

    # Ground station params
    lat_deg: float = Field(0.0, ge=-90, le=90)
    lon_deg: float = Field(0.0, ge=-180, le=180)
    min_elevation_deg: float = Field(5.0, ge=0, le=90)
    station_name: str = "Ground Station"


@router.post("/passes")
def get_passes(req: GroundTrackRequest):
    elements = OrbitalElements(
        altitude_km=req.altitude_km,
        inclination_deg=req.inclination_deg,
        eccentricity=req.eccentricity,
        raan_deg=req.raan_deg,
        arg_perigee_deg=req.arg_perigee_deg,
        true_anomaly_deg=req.true_anomaly_deg,
    )
    orbit_data = simulate_orbit(
        elements,
        num_periods=req.num_periods,
        num_points=req.num_points,
        use_j2=req.use_j2,
    )

    station = GroundStation(
        lat_deg=req.lat_deg,
        lon_deg=req.lon_deg,
        min_elevation_deg=req.min_elevation_deg,
        name=req.station_name,
    )

    pass_data = compute_passes(orbit_data["positions"], orbit_data["times"], station)

    return {
        **pass_data,
        "simulated_periods": req.num_periods,
        "period_min": orbit_data["period_min"],
    }