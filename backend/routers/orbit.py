from fastapi import APIRouter
from pydantic import BaseModel, Field
from orbit_simulator import OrbitalElements, simulate_orbit, eci_to_geographic

router = APIRouter()


class OrbitRequest(BaseModel):
    altitude_km: float = Field(400.0, ge=160, le=40_000, description="Altitude in km")
    inclination_deg: float = Field(51.6, ge=0, le=180)
    eccentricity: float = Field(0.0, ge=0, lt=1)
    raan_deg: float = Field(0.0, ge=0, le=360)
    arg_perigee_deg: float = Field(0.0, ge=0, le=360)
    true_anomaly_deg: float = Field(0.0, ge=0, le=360)
    num_periods: float = Field(1.0, ge=0.1, le=20)
    num_points: int = Field(500, ge=100, le=2000)
    use_j2: bool = False
    include_ground_track: bool = True


@router.post("/simulate")
def simulate(req: OrbitRequest):
    elements = OrbitalElements(
        altitude_km=req.altitude_km,
        inclination_deg=req.inclination_deg,
        eccentricity=req.eccentricity,
        raan_deg=req.raan_deg,
        arg_perigee_deg=req.arg_perigee_deg,
        true_anomaly_deg=req.true_anomaly_deg,
    )

    result = simulate_orbit(
        elements,
        num_periods=req.num_periods,
        num_points=req.num_points,
        use_j2=req.use_j2,
    )

    if req.include_ground_track:
        result["ground_track"] = eci_to_geographic(result["positions"], result["times"])

    return result