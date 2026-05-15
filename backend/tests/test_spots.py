import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_spot(client: AsyncClient, auth_headers: dict):
    response = await client.post("/api/v1/spots", json={
        "name": "New Spot",
        "description": "A brand new spot",
        "latitude": 55.751244,
        "longitude": 37.618423,
        "city": "Moscow",
        "category": "street",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Spot"
    assert data["category"] == "street"


@pytest.mark.asyncio
async def test_create_spot_unauthorized(client: AsyncClient):
    response = await client.post("/api/v1/spots", json={
        "name": "Unauthorized Spot",
        "latitude": 55.75,
        "longitude": 37.61,
        "city": "Moscow",
        "category": "park",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_spots(client: AsyncClient, test_spot):
    response = await client.get("/api/v1/spots")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["spots"]) >= 1


@pytest.mark.asyncio
async def test_get_spot(client: AsyncClient, test_spot):
    spot_id = str(test_spot.id)
    response = await client.get(f"/api/v1/spots/{spot_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Spot"
    assert data["city"] == "Moscow"


@pytest.mark.asyncio
async def test_get_spot_not_found(client: AsyncClient):
    response = await client.get("/api/v1/spots/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_my_spots(client: AsyncClient, auth_headers: dict, test_user, test_spot):
    response = await client.get("/api/v1/spots/my", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["author_id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_update_spot(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    response = await client.put(f"/api/v1/spots/{spot_id}", json={
        "name": "Updated Spot",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Spot"


@pytest.mark.asyncio
async def test_delete_spot(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    response = await client.delete(f"/api/v1/spots/{spot_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_filter_spots_by_category(client: AsyncClient, test_spot):
    response = await client.get("/api/v1/spots?category=park")
    assert response.status_code == 200
    data = response.json()
    assert all(s["category"] == "park" for s in data["spots"])


@pytest.mark.asyncio
async def test_filter_spots_by_city(client: AsyncClient, test_spot):
    response = await client.get("/api/v1/spots?city=Moscow")
    assert response.status_code == 200
    data = response.json()
    assert any(s["city"].lower() == "moscow" for s in data["spots"])


@pytest.mark.asyncio
async def test_create_spot_with_obstacles(client: AsyncClient, auth_headers: dict):
    response = await client.post("/api/v1/spots", json={
        "name": "Spot with Obstacles",
        "latitude": 55.75,
        "longitude": 37.61,
        "city": "Moscow",
        "category": "street",
        "obstacles": [
            {"type": "ledge"},
            {"type": "stairs", "count": 5},
            {"type": "rail"},
        ],
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert len(data["obstacles"]) == 3
    types = {o["type"] for o in data["obstacles"]}
    assert "ledge" in types
    assert "stairs" in types
    stair = next(o for o in data["obstacles"] if o["type"] == "stairs")
    assert stair["count"] == 5


@pytest.mark.asyncio
async def test_update_spot_obstacles(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    response = await client.put(f"/api/v1/spots/{spot_id}", json={
        "obstacles": [{"type": "bowl"}, {"type": "quarter_pipe"}],
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["obstacles"]) == 2
    assert data["obstacles"][0]["type"] == "bowl"


@pytest.mark.asyncio
async def test_filter_spots_by_obstacle_type(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/spots", json={
        "name": "Ledge Spot",
        "latitude": 55.75,
        "longitude": 37.61,
        "city": "Moscow",
        "category": "street",
        "obstacles": [{"type": "ledge"}],
    }, headers=auth_headers)
    await client.post("/api/v1/spots", json={
        "name": "Rail Spot",
        "latitude": 55.76,
        "longitude": 37.62,
        "city": "Moscow",
        "category": "street",
        "obstacles": [{"type": "rail"}],
    }, headers=auth_headers)

    response = await client.get("/api/v1/spots?obstacle_type=ledge")
    assert response.status_code == 200
    data = response.json()
    assert any(s["name"] == "Ledge Spot" for s in data["spots"])
    assert not any(s["name"] == "Rail Spot" for s in data["spots"])


@pytest.mark.asyncio
async def test_filter_spots_by_stair_count(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/spots", json={
        "name": "5 Stairs",
        "latitude": 55.75,
        "longitude": 37.61,
        "city": "Moscow",
        "category": "street",
        "obstacles": [{"type": "stairs", "count": 5}],
    }, headers=auth_headers)
    await client.post("/api/v1/spots", json={
        "name": "10 Stairs",
        "latitude": 55.76,
        "longitude": 37.62,
        "city": "Moscow",
        "category": "street",
        "obstacles": [{"type": "stairs", "count": 10}],
    }, headers=auth_headers)

    response = await client.get("/api/v1/spots?obstacle_type=stairs&stair_count=5")
    assert response.status_code == 200
    data = response.json()
    assert any(s["name"] == "5 Stairs" for s in data["spots"])
    assert not any(s["name"] == "10 Stairs" for s in data["spots"])


@pytest.mark.asyncio
async def test_update_spot_status(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    response = await client.patch(f"/api/v1/spots/{spot_id}/status", json={
        "status": "bust",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "bust"
    assert data["last_status_at"] is not None


@pytest.mark.asyncio
async def test_update_spot_status_unauthorized(client: AsyncClient, test_spot):
    spot_id = str(test_spot.id)
    response = await client.patch(f"/api/v1/spots/{spot_id}/status", json={
        "status": "active",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_spot_response_has_status_fields(client: AsyncClient, test_spot):
    spot_id = str(test_spot.id)
    response = await client.get(f"/api/v1/spots/{spot_id}")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "last_status_at" in data
    assert "video" in data
    assert "obstacles" in data
