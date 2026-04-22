from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from services.healing_service import HealingService
from services.ai_service import AIService
from pydantic import BaseModel
from prometheus_client import make_asgi_app, Counter, Histogram
import time
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AutoOps-AI")

app = FastAPI(title="AutoOps AI Backend")

# Prometheus Metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

HEALING_ACTIONS = Counter("autoops_healing_actions_total", "Total healing actions taken", ["service", "action"])
AI_ANALYSIS_TIME = Histogram("autoops_ai_analysis_seconds", "Time spent on AI log analysis")

# Services
healing_service = HealingService()
ai_service = AIService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Alert(BaseModel):
    status: str
    labels: dict
    annotations: dict

class LogAnalysisRequest(BaseModel):
    logs: str

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/system/status")
def get_system_status():
    return healing_service.get_system_health()

@app.post("/alerts/webhook")
async def handle_alert(alert: Alert, background_tasks: BackgroundTasks):
    """Endpoint for Prometheus Alertmanager"""
    service_name = alert.labels.get("container_name") or alert.labels.get("job")
    logger.info(f"Received alert: {alert.status} for {service_name}")
    
    if alert.status == "firing":
        # In a real scenario, we might trigger AI analysis first
        # For now, we'll trigger auto-healing (restart)
        background_tasks.add_task(healing_service.restart_service, service_name)
        HEALING_ACTIONS.labels(service=service_name, action="restart").inc()
    
    return {"status": "acknowledged"}

@app.post("/ai/analyze")
async def analyze_logs(request: LogAnalysisRequest):
    with AI_ANALYSIS_TIME.time():
        result = await ai_service.analyze_logs(request.logs)
    return result

@app.post("/healing/restart/{service_name}")
def manual_restart(service_name: str):
    result = healing_service.restart_service(service_name)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    HEALING_ACTIONS.labels(service=service_name, action="manual_restart").inc()
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
