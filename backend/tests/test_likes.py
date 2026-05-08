import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_toggle_like_add(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    response = await client.post(f"/api/v1/likes/{spot_id}", headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["liked"] is True
    assert data["likes_count"] >= 1


@pytest.mark.asyncio
async def test_toggle_like_remove(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    await client.post(f"/api/v1/likes/{spot_id}", headers=auth_headers)
    response = await client.post(f"/api/v1/likes/{spot_id}", headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["liked"] is False
    assert data["likes_count"] == 0


@pytest.mark.asyncio
async def test_like_unauthorized(client: AsyncClient, test_spot):
    spot_id = str(test_spot.id)
    response = await client.post(f"/api/v1/likes/{spot_id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_spot_with_liked(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    await client.post(f"/api/v1/likes/{spot_id}", headers=auth_headers)
    response = await client.get(f"/api/v1/likes/spot/{spot_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["liked"] is True
    assert data["likes_count"] >= 1
