from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from app.core.akita_wrapper import get_orchestrator, PipelineOrchestrator
from pydantic import BaseModel

router = APIRouter()

class PluginGenerateRequest(BaseModel):
    name: str
    description: str
    tools: Optional[List[Dict[str, Any]]] = None

@router.post("/generate") # This will be prefixed with /plugins in main.py
async def generate_plugin(req: PluginGenerateRequest, orchestrator: PipelineOrchestrator = Depends(get_orchestrator)):
    template = await orchestrator.generate_plugin_template(req.name, req.description, req.tools)
    if not template:
        raise HTTPException(status_code=500, detail="Failed to generate plugin template from Core")
    return {"template": template}
