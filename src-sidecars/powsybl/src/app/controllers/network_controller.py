from src.features.network.manager import NetworkManager
from src.utils.logger import get_logger

logger = get_logger(__name__)

class NetworkController:
    
    def __init__(self, network_path: str):
        self._network_manager = None
        self._setup_network(network_path)
    
    def _setup_network(self, network_path: str) -> None:
        """Initialise le gestionnaire de réseau"""
        try:
            self._network_manager = NetworkManager(network_path)
            logger.info(f"NetworkController initialized with {network_path}")
        except Exception as e:
            logger.error(f"Failed to initialize NetworkController: {e}")
            raise
        
    async def get_single_line_diagram(self, element_id: str, response_format: str = "json"):
        """Récupère le diagramme unifilaire pour un élément"""
        try:
            if not self._network_manager:
                logger.error("Network manager not initialized")
                return 500, {"error": "Network manager not initialized"}
            
            # Vérification synchrone de l'existence de l'élément
            if not self._network_manager.element_exists(element_id):
                logger.warning(f"Element {element_id} not found in network")
                return 404, {"error": f"The identifier '{element_id}' doesn't exist in the network"}
            
            # Générer le diagramme
            svg_content, metadata = await self._network_manager.generate_single_line_diagram(element_id)
            
            if svg_content is None:
                error_msg = "Failed to generate diagram"
                if metadata and "error" in metadata:
                    error_msg += f": {metadata['error']}"
                
                logger.error(f"SLD generation failed for {element_id}: {error_msg}")
                return 500, {
                    "error": error_msg,
                    "details": metadata.get("error", "Unknown error") if metadata else "Unknown error",
                }
            
            # Retourner la réponse selon le format demandé
            if response_format == "json":
                return 200, {"svg": svg_content, "metadata": metadata}
            else:
                return 200, {
                    "content_type": "image/svg+xml", 
                    "svg": svg_content, 
                    "metadata": metadata
                }
                
        except Exception as e:
            logger.error(f"Unexpected error in get_single_line_diagram for {element_id}: {e}")
            return 500, {"error": f"Internal server error: {str(e)}"}