import pytest

@pytest.mark.asyncio
async def test_read_main(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_health_check(client):
    # The root endpoint acts as health check
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
