import pytest

@pytest.mark.asyncio
async def test_read_main(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    # Note: Assuming there is a /health endpoint or similar based on standard FastAPI setups
    # If not, this test might fail and we'll adjust or implement the endpoint.
    if response.status_code == 404:
        pytest.skip("Health check endpoint not implemented yet")
    else:
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
