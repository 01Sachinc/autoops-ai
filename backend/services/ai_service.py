import httpx
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "llama3")

class AIService:
    async def analyze_logs(self, logs: str):
        prompt = f"""
        You are a DevOps AI Expert. Analyze the following log snippet and:
        1. Identify the root cause of any errors.
        2. Suggest a specific fix or remediation script.
        3. Rate the severity (Critical, Warning, Info).

        LOGS:
        {logs}

        RESPONSE FORMAT: JSON with keys 'cause', 'suggestion', 'severity'
        """

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": MODEL_NAME,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Ollama connection error: {e}")
            return {
                "error": "Ollama service unavailable",
                "details": str(e),
                "cause": "Connection failure",
                "suggestion": "Check if Ollama container is running and model is pulled",
                "severity": "Critical"
            }

    async def check_health(self):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{OLLAMA_URL}/api/tags")
                return resp.status_code == 200
        except:
            return False
