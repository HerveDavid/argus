import json
import pypowsybl as pp
import pypowsybl.network as pn
from typing import Tuple, Optional, Dict, Any
from contextlib import contextmanager
import tempfile
import os
from src.utils.logger import get_logger

logger = get_logger(__name__)

SLD_PARAMETERS = {
    "use_name": True,
    "center_name": True,
    "diagonal_label": False,
    "nodes_infos": True,
    "tooltip_enabled": True,
    "topological_coloring": True,
    "display_current_feeder_info": True,
    "component_library": "Convergence",
    "active_power_unit": "MW",
}

NAD_PARAMETERS = {
    "edge_name_displayed": True,
    "id_displayed": False,
    "edge_info_along_edge": True,
    "power_value_precision": 1,
    "angle_value_precision": 1,
    "current_value_precision": 0,
    "voltage_value_precision": 1,
    "bus_legend": True,
    "substation_description_displayed": True,
}

class NetworkManager:
    
    def __init__(self, network_path: str):
        self._network = None
        self._setup_network(network_path)
    
    def _setup_network(self, network_path: str) -> None:
        """Charge le réseau depuis le fichier"""
        try:
            self._network = pp.network.load(network_path)
            logger.info(f"Loaded {network_path}")
        except Exception as e:
            logger.error(f"Failed to load network from {network_path}: {e}")
            raise
    
    @contextmanager
    def _temp_file(self, suffix: str):
        """Context manager pour créer un fichier temporaire"""
        fd, path = tempfile.mkstemp(suffix=suffix)
        try:
            os.close(fd)  # Fermer le file descriptor
            yield path
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass
    
    def element_exists(self, element_id: str) -> bool:
        """Vérifie si l'élément existe dans le réseau (SYNCHRONE)"""
        if not self._network:
            logger.warning("Network not loaded")
            return False
        
        try:
            # Vérifier dans les voltage levels
            voltage_levels = self._network.get_voltage_levels()
            if element_id in voltage_levels.index:
                logger.debug(f"Element {element_id} found in voltage levels")
                return True
            
            # Vérifier dans les substations
            substations = self._network.get_substations()
            if element_id in substations.index:
                logger.debug(f"Element {element_id} found in substations")
                return True
            
            logger.debug(f"Element {element_id} not found in network")
            return False
            
        except Exception as e:
            logger.error(f"Error checking element existence for {element_id}: {e}")
            return False
        
    async def generate_single_line_diagram(
        self, element_id: str
    ) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
        """Génère le diagramme unifilaire pour un élément"""
        if not self._network:
            logger.error("Network not loaded")
            return None, {"error": "Network not loaded"}
        
        # Vérification synchrone de l'existence
        if not self.element_exists(element_id):
            logger.warning(f"Element {element_id} does not exist")
            return None, {"error": f"Element {element_id} does not exist"}
        
        params = pn.SldParameters(**SLD_PARAMETERS)
        
        try:
            with (
                self._temp_file(".svg") as svg_path,
                self._temp_file(".json") as metadata_path,
            ):
                logger.debug(f"Generating SLD for {element_id}")
                
                # Générer le diagramme SVG avec métadonnées
                self._network.write_single_line_diagram_svg(
                    container_id=element_id,
                    svg_file=svg_path,
                    metadata_file=metadata_path,
                    parameters=params,
                )
                
                # Lire le contenu SVG généré
                with open(svg_path, "r", encoding="utf-8") as svg_file:
                    svg_content = svg_file.read()
                
                # Lire les métadonnées générées
                with open(metadata_path, "r", encoding="utf-8") as metadata_file:
                    metadata_content = json.load(metadata_file)
                
                logger.info(f"Successfully generated SLD for {element_id}")
                return svg_content, metadata_content
                
        except Exception as e:
            logger.error(f"Error generating SLD for {element_id}: {e}")
            return None, {"error": str(e)}