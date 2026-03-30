from fastapi import APIRouter
from pydantic import BaseModel, Field
from mission_planner import ManeuverRequest, hohmann_transfer

router = APIRouter()


class MissionRequest(BaseModel):
    initial_altitude_km: float = Field(400.0, ge=160, le=40_000)
    target_altitude_km: float = Field(35_786.0, ge=160, le=40_000)
    spacecraft_mass_kg: float = Field(1000.0, ge=1, le=100_000)
    isp_s: float = Field(300.0, ge=50, le=500)


@router.post("/hohmann")
def hohmann(req: MissionRequest):
    maneuver = ManeuverRequest(
        initial_altitude_km=req.initial_altitude_km,
        target_altitude_km=req.target_altitude_km,
        spacecraft_mass_kg=req.spacecraft_mass_kg,
        isp_s=req.isp_s,
    )
    return hohmann_transfer(maneuver)