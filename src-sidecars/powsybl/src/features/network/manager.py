import json

import pypowsybl as pp
import pypowsybl.network  as pn

from typing import Tuple, Optional, Dict, Any

from src.utils.logger import get_logger

logger = get_logger(__name__)

SLD_PARAMETERS = {
    "use_name": True,
    "center_name": True,
    "diagonal_label": True,
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
        self._setup_network(network_path)
    
    def _setup_network(self, network_path: str) -> None:
        self._network = pp.network.load(network_path)
        logger.info(f"Loaded {network_path}")

    async def element_exists(self, element_id: str) -> bool:     
        if not self._network:
            return False

        try:
            voltage_levels = self._network.get_voltage_levels()
            if element_id in voltage_levels.index:
                return True

            substations = self._network.get_substations()
            if element_id in substations.index:
                return True

            return False
        except Exception:
            return False
        
    async def generate_single_line_diagram(
        self, element_id: str
    ) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
        if not self._network:
            return None, None
        
        if not self.element_exists(element_id):
            return None, None

        params = pn.SldParameters(**self.SLD_PARAMETERS)

        try:
            with (
                self._temp_file(".svg") as svg_path,
                self._temp_file(".json") as metadata_path,
            ):
                # Generate the SVG with metadata
                self._network.write_single_line_diagram_svg(
                    container_id=element_id,
                    svg_file=svg_path,
                    metadata_file=metadata_path,
                    parameters=params,
                )

                # Read the generated SVG content
                with open(svg_path, "r") as svg_file:
                    svg_content = svg_file.read()

                # Read the generated metadata
                with open(metadata_path, "r") as metadata_file:
                    metadata_content = json.load(metadata_file)

                return svg_content, metadata_content
        except Exception as e:
            return None, {"error": str(e)}
