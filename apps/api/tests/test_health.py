import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    res = await client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "BugBounty Hunter" in data["service"]
    assert data["api_v1"] == "/api/v1"


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_readiness_endpoint(client: AsyncClient):
    res = await client.get("/api/v1/readiness")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert "checks" in data


@pytest.mark.asyncio
async def test_models_list(client: AsyncClient):
    res = await client.get("/api/v1/models")
    assert res.status_code == 200
    data = res.json()
    assert "providers" in data
    assert "models" in data
    assert len(data["models"]) >= 2
