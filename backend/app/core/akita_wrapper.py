"""
AkitaLLM Wrapper - API Integration (Refactored)
"""
import asyncio
import httpx
from typing import Any, Callable, Optional
from datetime import datetime

class PipelineOrchestrator:
    """
    Client for the AkitaLLM Core HTTP Adapter.
    Delegates all execution and orchestration to the Core.
    """
    
    def __init__(self, base_url: str = "http://127.0.0.1:8765"):
        self.base_url = base_url

    async def _get_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def execute(
        self,
        config: dict[str, Any],
        on_log: Callable[[str], None] | None = None
    ) -> dict[str, Any]:
        """
        Execute an AkitaLLM command by calling the Core Adapter API.
        """
        start_time = datetime.utcnow()
        mode = config.get("mode", "review")
        target = config.get("target", ".")
        
        async with await self._get_client() as client:
            try:
                # 1. Trigger Execution
                if on_log:
                    on_log(f"🔗 Connecting to AkitaLLM Core Adapter at {self.base_url}...")
                
                resp = await client.post("/v1/execute", json={
                    "mode": mode,
                    "target": target,
                    "options": config.get("options")
                })
                resp.raise_for_status()
                execution_info = resp.json()
                execution_id = execution_info["execution_id"]
                
                if on_log:
                    on_log(f"🆔 Execution started: {execution_id}")

                # 2. Poll for Status and Logs
                last_log_index = 0
                while True:
                    # Fetch logs
                    logs_resp = await client.get(f"/v1/logs/{execution_id}", params={"last_index": last_log_index})
                    if logs_resp.status_code == 200:
                        new_logs = logs_resp.json().get("logs", [])
                        for log in new_logs:
                            if on_log:
                                on_log(log)
                        last_log_index += len(new_logs)

                    status_resp = await client.get(f"/v1/status/{execution_id}")
                    status_resp.raise_for_status()
                    data = status_resp.json()
                    
                    status = data["status"]
                    if status in ["succeeded", "failed"]:
                        success = status == "succeeded"
                        elapsed = (datetime.utcnow() - start_time).total_seconds()
                        
                        return {
                            "success": success,
                            "data": {"result": data.get("result")},
                            "error": data.get("error") if not success else None,
                            "elapsed_seconds": elapsed
                        }
                    
                    await asyncio.sleep(1.0) # Poll every second

            except Exception as e:
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                error_msg = f"Adapter Communication Error: {str(e)}"
                if on_log:
                    on_log(f"❌ {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "elapsed_seconds": elapsed
                }

    async def index_project(self, path: str) -> bool:
        """Delegate indexing to the Core."""
        async with await self._get_client() as client:
            resp = await client.post("/v1/index", params={"path": path})
            return resp.status_code == 200

    async def generate_plugin_template(self, name: str, description: str, tools: Optional[List[Dict[str, Any]]] = None) -> Optional[str]:
        """Fetch plugin template from the Core."""
        async with await self._get_client() as client:
            resp = await client.post("/v1/plugins/generate", json=tools, params={"name": name, "description": description})
            if resp.status_code == 200:
                return resp.json().get("template")
            return None

    async def apply_diff(self, diff: str, base_path: str = ".") -> bool:
        """Delegate diff application to the Core."""
        async with await self._get_client() as client:
            resp = await client.post("/v1/diff/apply", json={"diff": diff, "base_path": base_path})
            if resp.status_code == 200:
                return resp.json().get("success", False)
            return False

# Singleton
_orchestrator: PipelineOrchestrator | None = None

def get_orchestrator() -> PipelineOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PipelineOrchestrator()
    return _orchestrator
