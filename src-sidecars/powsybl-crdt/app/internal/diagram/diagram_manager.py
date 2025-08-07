import json
import logging
from pathlib import Path

import pypowsybl as pp
import pypowsybl.network as pn
from typing import Tuple, Optional, Dict, Any, Union
from contextlib import contextmanager
import tempfile
import os

logger = logging.getLogger(__name__)

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


class DiagramManager:

    def __init__(self, network_source: Union[str, Path, pn.Network]):
        self._network = None
        self._setup_network(network_source)

    def _setup_network(self, network_source: Union[str, Path, pn.Network]) -> None:
        if isinstance(network_source, pn.Network):
            self._network = network_source
        else:
            self._network = pp.network.load(network_source)
            logger.info(f"Loaded network from {network_source}")

    @contextmanager
    def _temp_file(self, suffix: str):
        fd, path = tempfile.mkstemp(suffix=suffix)
        try:
            os.close(fd)
            yield path
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass

    def element_exists(self, element_id: str) -> bool:
        if not self._network:
            logger.warning("Network not loaded")
            return False

        try:
            voltage_levels = self._network.get_voltage_levels()
            if element_id in voltage_levels.index:
                logger.debug(f"Element {element_id} found in voltage levels")
                return True

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
        if not self._network:
            logger.error("Network not loaded")
            return None, {"error": "Network not loaded"}

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

                self._network.write_single_line_diagram_svg(
                    container_id=element_id,
                    svg_file=svg_path,
                    metadata_file=metadata_path,
                    parameters=params,
                )

                with open(svg_path, "r", encoding="utf-8") as svg_file:
                    svg_content = svg_file.read()

                with open(metadata_path, "r", encoding="utf-8") as metadata_file:
                    metadata_content = json.load(metadata_file)

                logger.info(f"Successfully generated SLD for {element_id}")
                return svg_content, metadata_content

        except Exception as e:
            logger.error(f"Error generating SLD for {element_id}: {e}")
            return None, {"error": str(e)}

    async def generate_network_area_diagram(
            self,
            voltage_level_ids: Union[str, list[str]] = None,
            depth: int = 0,
            high_nominal_voltage_bound: float = -1,
            low_nominal_voltage_bound: float = -1
    ) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
        if not self._network:
            logger.error("Network not loaded")
            return None, {"error": "Network not loaded"}

        if voltage_level_ids is not None:
            if isinstance(voltage_level_ids, str):
                voltage_level_ids_list = [voltage_level_ids]
            else:
                voltage_level_ids_list = voltage_level_ids

            for vl_id in voltage_level_ids_list:
                if not self.element_exists(vl_id):
                    logger.warning(f"Voltage level {vl_id} does not exist")
                    return None, {"error": f"Voltage level {vl_id} does not exist"}

        nad_params = pn.NadParameters(**NAD_PARAMETERS)

        try:
            with (
                self._temp_file(".svg") as svg_path,
                self._temp_file(".json") as metadata_path,
            ):
                logger.debug(f"Generating NAD for voltage levels: {voltage_level_ids}")

                self._network.write_network_area_diagram(
                    svg_file=svg_path,
                    metadata_file=metadata_path,
                    voltage_level_ids=voltage_level_ids,
                    depth=depth,
                    high_nominal_voltage_bound=high_nominal_voltage_bound,
                    low_nominal_voltage_bound=low_nominal_voltage_bound,
                    nad_parameters=nad_params,
                )

                with open(svg_path, "r", encoding="utf-8") as svg_file:
                    svg_content = svg_file.read()

                with open(metadata_path, "r", encoding="utf-8") as metadata_file:
                    metadata_content = json.load(metadata_file)

                logger.info(f"Successfully generated NAD for voltage levels: {voltage_level_ids}")
                return svg_content, metadata_content

        except Exception as e:
            logger.error(f"Error generating NAD for voltage levels {voltage_level_ids}: {e}")
            return None, {"error": str(e)}