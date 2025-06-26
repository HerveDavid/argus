from src.features.network.manager import NetworkManager
from src.utils.logger import get_logger

logger = get_logger(__name__)

class NetworkController:
    
    def __init__(self, network_path: str):
        self._setup_network(network_path)
    
    def _setup_network(self, network_path: str) -> None:
        self._network_manager = NetworkManager(network_path)
        logger.info(f"Loaded {network_path}")
        
    async def get_single_line_diagram(self, element_id: str, response_format: str):
        if not await self._network_manager.element_exists(element_id):
            return 404, {"error": f"The identifier '{element_id}' doesn't exist in the network"}
        
        svg_content, metadata = await self._network_manager.generate_single_line_diagram(element_id)
        
        if svg_content is None:
            return 500, {
                "error": "Failed to generate diagram",
                "details": metadata.get("error", "Unknown error"),
            }
            
        if response_format == "json":
            return 200, {"svg": svg_content, "metadata": metadata}
        else:
            return 200, {"content_type": "image/svg+xml", "svg": svg_content, "metadata": metadata}
        

    
