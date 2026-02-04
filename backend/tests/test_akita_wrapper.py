import pytest
from unittest.mock import patch, MagicMock
from app.core.akita_wrapper import PipelineOrchestrator

@pytest.fixture
def orchestrator():
    return PipelineOrchestrator(base_url="http://test-core")

@pytest.mark.asyncio
async def test_orchestrator_initialization(orchestrator):
    assert orchestrator.base_url == "http://test-core"

@pytest.mark.asyncio
async def test_orchestrator_execute_mock(orchestrator):
    # Mock the httpx client and its post/get methods
    with patch("httpx.AsyncClient.post") as mock_post, \
         patch("httpx.AsyncClient.get") as mock_get:
        
        # Mock /v1/execute response
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.json.return_value = {"execution_id": "test-123"}
        
        # Mock /v1/logs and /v1/status sequences
        mock_get.side_effect = [
            MagicMock(status_code=200, json=lambda: {"logs": ["Test log"]}), # First logs call
            MagicMock(status_code=200, json=lambda: {"status": "succeeded", "result": "done"}) # First status call
        ]
        
        result = await orchestrator.execute({"mode": "review", "target": "."})
        
        assert result["success"] is True
        assert result["data"]["result"] == "done"
        mock_post.assert_called_once()
