from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query
import httpx

router = APIRouter(prefix="/geo", tags=["geo"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org"


@router.get("/search")
async def search_cities(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(5, ge=1, le=20)
) -> List[Dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{NOMINATIM_URL}/search",
                params={
                    "q": q,
                    "format": "json",
                    "addressdetails": 1,
                    "limit": limit,
                    "accept-language": "ru",
                    "featuretype": "city,town,village,municipality"
                },
                headers={
                    "User-Agent": "SpotList/1.0 (contact@spotlist.app)"
                },
                timeout=10.0
            )
            
            if response.status_code == 429:
                return []
            
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data:
                address = item.get("address", {})
                city = (
                    address.get("city") or
                    address.get("town") or
                    address.get("village") or
                    address.get("municipality") or
                    address.get("county") or
                    item.get("display_name", "").split(",")[0]
                )
                if city:
                    results.append({
                        "city": city,
                        "display_name": item.get("display_name", ""),
                        "lat": float(item.get("lat", 0)),
                        "lon": float(item.get("lon", 0))
                    })
            
            return results[:limit]
        except Exception as e:
            print(f"Geo search error: {e}")
            return []


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{NOMINATIM_URL}/reverse",
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "addressdetails": 1,
                    "accept-language": "ru"
                },
                headers={
                    "User-Agent": "SpotList/1.0 (contact@spotlist.app)"
                },
                timeout=15.0
            )
            
            if response.status_code == 429:
                return {
                    "city": "Unknown",
                    "address": "",
                    "lat": lat,
                    "lon": lon
                }
            
            response.raise_for_status()
            data = response.json()

            address = data.get("address", {})
            city = (
                address.get("city") or
                address.get("town") or
                address.get("village") or
                address.get("municipality") or
                address.get("county") or
                address.get("state") or
                "Unknown"
            )

            return {
                "city": city,
                "address": data.get("display_name", ""),
                "lat": lat,
                "lon": lon
            }
        except Exception as e:
            print(f"Geo error: {e}")
            return {
                "city": "Unknown",
                "address": "",
                "lat": lat,
                "lon": lon
            }