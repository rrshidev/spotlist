from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.core.config import settings
from app.db.session import async_session

router = APIRouter(prefix="/spots", tags=["weather"])

cache: Dict[str, tuple[dict, datetime]] = {}
CACHE_TTL = timedelta(minutes=30)


async def get_spot_coords(spot_id: str) -> tuple[float, float]:
    async with async_session() as session:
        result = await session.execute(
            text("SELECT latitude, longitude FROM spots WHERE id = :id"),
            {"id": spot_id},
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Spot not found")
        return float(row[0]), float(row[1])


@router.get("/{spot_id}/weather")
async def get_weather(spot_id: str) -> Dict[str, Any]:
    now = datetime.utcnow()
    cached = cache.get(spot_id)
    if cached and cached[1] + CACHE_TTL > now:
        return cached[0]

    if not settings.OPENWEATHERMAP_API_KEY:
        raise HTTPException(status_code=503, detail="Weather service not configured")

    lat, lon = await get_spot_coords(spot_id)

    import httpx
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.OPENWEATHERMAP_BASE_URL}/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": settings.OPENWEATHERMAP_API_KEY,
                    "units": "metric",
                    "lang": "ru",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(status_code=503, detail="Invalid weather API key")
            raise HTTPException(status_code=502, detail="Weather service unavailable")
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Weather service unavailable")

    w = data.get("weather", [{}])[0]
    result = {
        "temp": round(data["main"]["temp"]),
        "feels_like": round(data["main"]["feels_like"]),
        "humidity": data["main"]["humidity"],
        "wind_speed": round(data["wind"]["speed"], 1),
        "description": w.get("description", ""),
        "icon": w.get("icon", ""),
        "condition": w.get("main", ""),
    }

    cache[spot_id] = (result, now)
    return result
