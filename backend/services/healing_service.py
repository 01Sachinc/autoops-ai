import docker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HealingService:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception as e:
            logger.error(f"Failed to connect to Docker: {e}")
            self.client = None

    def restart_service(self, service_name: str):
        if not self.client:
            return {"status": "error", "message": "Docker not connected"}
        
        try:
            container = self.client.containers.get(service_name)
            logger.info(f"Restarting container: {service_name}")
            container.restart()
            return {"status": "success", "message": f"Successfully restarted {service_name}"}
        except docker.errors.NotFound:
            return {"status": "error", "message": f"Container {service_name} not found"}
        except Exception as e:
            logger.error(f"Error restarting {service_name}: {e}")
            return {"status": "error", "message": str(e)}

    def scale_service(self, service_name: str, replicas: int):
        # Note: Scaling usually requires Docker Swarm or K8s. 
        # For plain Docker Compose, this is a placeholder or can be implemented via docker-compose commands.
        return {"status": "info", "message": "Scaling requires Swarm/K8s mode. Restarting instead."}

    def get_system_health(self):
        if not self.client:
            return []
        
        containers = self.client.containers.list(all=True)
        return [
            {
                "name": c.name,
                "status": c.status,
                "image": str(c.image.tags[0]) if c.image.tags else "unknown"
            } for c in containers
        ]
