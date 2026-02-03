"""
AkitaLLM Wrapper - CLI Integration
"""
import asyncio
import os
from typing import Any, Callable, AsyncGenerator
from datetime import datetime

class PipelineOrchestrator:
    """
    Wrapper around AkitaLLM CLI.
    Invokes 'akita' commands via subprocess and streams output.
    """
    
    def __init__(self):
        self._cwd = os.getcwd() # Default to current working directory

    @property
    def is_available(self) -> bool:
        """Check if akita CLI is available."""
        # Simple check, can be improved
        return True
    
    async def execute(
        self,
        config: dict[str, Any],
        on_log: Callable[[str], None] | None = None
    ) -> dict[str, Any]:
        """
        Execute an AkitaLLM command based on config.
        
        Config expected:
        - mode: 'review' | 'plan' | 'solve'
        - target: str (path or instruction)
        - cwd: str (optional working directory)
        """
        start_time = datetime.utcnow()
        mode = config.get("mode", "review")
        target = config.get("target", ".")
        working_dir = config.get("cwd", self._cwd)
        
        # Build command
        cmd = ["akita"]
        if mode == "review":
            cmd.extend(["review", target])
        elif mode == "plan":
            cmd.extend(["plan", f'"{target}"'])
        elif mode == "solve":
            cmd.extend(["solve", f'"{target}"'])
        else:
            return {"success": False, "error": f"Unknown mode: {mode}"}

        full_command = " ".join(cmd)
        
        if on_log:
            on_log(f"🚀 Executing: {full_command}")
            on_log(f"📂 Working Directory: {working_dir}")

        output_buffer = []

        try:
            # Create subprocess
            process = await asyncio.create_subprocess_shell(
                full_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=working_dir
            )

            # Stream output
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                
                decoded_line = line.decode().strip()
                if decoded_line:
                    output_buffer.append(decoded_line)
                    if on_log:
                        on_log(decoded_line)

            await process.wait()
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            success = process.returncode == 0

            return {
                "success": success,
                "data": {"output": "\n".join(output_buffer)},
                "error": None if success else "Command failed (non-zero exit code)",
                "elapsed_seconds": elapsed
            }

        except Exception as e:
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            if on_log:
                on_log(f"❌ Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "elapsed_seconds": elapsed
            }

# Singleton
_orchestrator: PipelineOrchestrator | None = None

def get_orchestrator() -> PipelineOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PipelineOrchestrator()
    return _orchestrator
