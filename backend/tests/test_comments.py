import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_comment(client: AsyncClient, auth_headers: dict, test_spot):
    spot_id = str(test_spot.id)
    response = await client.post(f"/api/v1/spots/{spot_id}/comments", json={
        "content": "Great spot!",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Great spot!"
    assert data["spot_id"] == spot_id


@pytest.mark.asyncio
async def test_create_comment_unauthorized(client: AsyncClient, test_spot):
    spot_id = str(test_spot.id)
    response = await client.post(f"/api/v1/spots/{spot_id}/comments", json={
        "content": "No auth comment",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_comments(client: AsyncClient, test_spot, test_comment):
    spot_id = str(test_spot.id)
    response = await client.get(f"/api/v1/spots/{spot_id}/comments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["content"] == "Test comment"


@pytest.mark.asyncio
async def test_update_comment(client: AsyncClient, auth_headers: dict, test_comment):
    comment_id = str(test_comment.id)
    response = await client.put(f"/api/v1/comments/{comment_id}", json={
        "content": "Updated comment",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated comment"


@pytest.mark.asyncio
async def test_delete_comment(client: AsyncClient, auth_headers: dict, test_comment):
    comment_id = str(test_comment.id)
    response = await client.delete(f"/api/v1/comments/{comment_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_report_comment(client: AsyncClient, auth_headers: dict, test_comment):
    comment_id = str(test_comment.id)
    response = await client.post(f"/api/v1/comments/{comment_id}/report", json={
        "reason": "Spam",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["reason"] == "Spam"
    assert data["comment_id"] == comment_id


@pytest.mark.asyncio
async def test_get_user_comments(client: AsyncClient, auth_headers: dict, test_user, test_comment):
    response = await client.get("/api/v1/comments/user", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["content"] == "Test comment"
    assert data[0]["spot_name"] is not None
