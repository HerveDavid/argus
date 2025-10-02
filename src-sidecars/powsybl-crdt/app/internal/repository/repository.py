import logging
from pathlib import Path

import duckdb as db
import pypowsybl as pp
import pypowsybl.network as pn
from typing import List, Union, Optional

from app.shared import BaseRepository

from .manager import Manager
from .game_master_outputs.repository import GameMasterOutputsRepository
from .aliases.repository import AliasesRepository
from .areas.repository import AreasRepository
from .areas_boundaries.repository import AreasBoundariesRepository
from .areas_voltage_levels.repository import AreasVoltageLevelsRepository
from .bus_breaker_view_buses.repository import BusBreakerViewBusesRepository
from .busbar_sections.repository import BusbarSectionsRepository
from .batteries.repository import BatteriesRepository
from .branches.repository import BranchesRepository
from .buses.repository import BusesRepository
from .dangling_lines.repository import DanglingLinesRepository
from .generators.repository import GeneratorsRepository
from .hvdc_lines.repository import HvdcLinesRepository
from .identifiables.repository import IdentifiablesRepository
from .injections.repository import InjectionsRepository
from .lcc_converter_stations.repository import LccConverterStationsRepository
from .linear_shunt_compensator_sections.repository import LinearShuntCompensatorSectionsRepository
from .lines.repository import LinesRepository
from .loads.repository import LoadsRepository
from .non_linear_shunt_compensator_sections.repository import NonLinearShuntCompensatorSectionsRepository
from .operational_limits.repository import OperationalLimitsRepository
from .phase_tab_changer_steps.repository import PhaseTapChangerStepsRepository
from .phase_tab_changers.repository import PhaseTapChangersRepository
from .ratio_tab_changer_steps.repository import RatioTapChangerStepsRepository
from .ratio_tab_changers.repository import RatioTapChangersRepository
from .reactive_capability_curve_points.repository import ReactiveCapabilityCurvePointsRepository
from .scada_inputs.repository import ScadaInputsRepository
from .scada_outputs.repository import ScadaOutputsRepository
from .shunt_compensators.repository import ShuntCompensatorsRepository
from .static_var_compensators.repository import StaticVarCompensatorsRepository
from .substations.repository import SubstationsRepository
from .switches.repository import SwitchesRepository
from .terminals.repository import TerminalsRepository
from .three_windings_transformers.repository import ThreeWindingsTransformersRepository
from .tie_lines.repository import TieLinesRepository
from .two_windings_transformers.repository import TwoWindingsTransformersRepository
from .voltage_levels.repository import VoltageLevelsRepository
from .vsc_converter_stations.repository import VscConverterStationsRepository

logger = logging.getLogger(__name__)

class Repository:

    def __init__(
            self,
            network_source: Union[str, Path, pn.Network],
            game_master_outputs_data: Optional[List[dict]] = None,
            scada_outputs_data: Optional[List[dict]] = None,
            scada_inputs_data: Optional[List[dict]] = None,
    ):
        self._game_master_outputs_data = game_master_outputs_data or []
        self._scada_outputs_data = scada_outputs_data or []
        self._scada_inputs_data = scada_inputs_data or []

        self._setup_network(network_source)
        self._setup_database()
        self._setup_repositories()

    def _setup_network(self, network_source: Union[str, Path, pn.Network]) -> None:
        if isinstance(network_source, pn.Network):
            self._network = network_source
        else:
            self._network = pp.network.load(network_source)
            logger.info(f"Loaded network from {network_source}")

    def _setup_database(self) -> None:
        self._conn = db.connect(":memory:")
        logger.info(f"Database connection established")

    def _setup_repositories(self) -> None:
        self._repo_manager = Manager(self._conn, self._network)

        self._repo_manager.register_repository("substations", SubstationsRepository)
        self._repo_manager.register_repository("voltage_levels", VoltageLevelsRepository)
        self._repo_manager.register_repository("lines", LinesRepository)
        self._repo_manager.register_repository("three_windings_transformers", ThreeWindingsTransformersRepository)
        self._repo_manager.register_repository("two_windings_transformers", TwoWindingsTransformersRepository)
        self._repo_manager.register_repository("aliases", AliasesRepository)
        self._repo_manager.register_repository("areas", AreasRepository)
        self._repo_manager.register_repository("areas_boundaries", AreasBoundariesRepository)
        self._repo_manager.register_repository("areas_voltage_levels", AreasVoltageLevelsRepository)
        self._repo_manager.register_repository("batteries", BatteriesRepository)
        self._repo_manager.register_repository("branches", BranchesRepository)
        self._repo_manager.register_repository("busbar_sections", BusbarSectionsRepository)
        self._repo_manager.register_repository("buses", BusesRepository)
        self._repo_manager.register_repository("bus_breaker_view_buses", BusBreakerViewBusesRepository)
        self._repo_manager.register_repository("dangling_lines", DanglingLinesRepository)
        self._repo_manager.register_repository("generators", GeneratorsRepository)
        self._repo_manager.register_repository("hvdc_lines", HvdcLinesRepository)
        self._repo_manager.register_repository("identifiables", IdentifiablesRepository)
        self._repo_manager.register_repository("injections", InjectionsRepository)
        self._repo_manager.register_repository("lcc_converter_stations", LccConverterStationsRepository)
        self._repo_manager.register_repository("loads", LoadsRepository)
        self._repo_manager.register_repository("linear_shunt_compensator_sections", LinearShuntCompensatorSectionsRepository)
        self._repo_manager.register_repository("non_linear_shunt_compensator_sections", NonLinearShuntCompensatorSectionsRepository)
        self._repo_manager.register_repository("operational_limits", OperationalLimitsRepository)
        self._repo_manager.register_repository("phase_tab_changer_steps", PhaseTapChangerStepsRepository)
        self._repo_manager.register_repository("phase_tab_changers", PhaseTapChangersRepository)
        self._repo_manager.register_repository("ratio_tab_changer_steps", RatioTapChangerStepsRepository)
        self._repo_manager.register_repository("ratio_tab_changers", RatioTapChangersRepository)
        self._repo_manager.register_repository("reactive_capability_curve_points", ReactiveCapabilityCurvePointsRepository)
        self._repo_manager.register_repository("shunt_compensators", ShuntCompensatorsRepository)
        self._repo_manager.register_repository("static_var_compensators", StaticVarCompensatorsRepository)
        self._repo_manager.register_repository("switches", SwitchesRepository)
        self._repo_manager.register_repository("terminals", TerminalsRepository)
        self._repo_manager.register_repository("vsc_converter_stations", VscConverterStationsRepository)
        self._repo_manager.register_repository("tie_lines", TieLinesRepository)

        if self._game_master_outputs_data:
            self._repo_manager.register_custom_repository(
                "game_master_outputs",
                GameMasterOutputsRepository,
                self._game_master_outputs_data
            )

        if self._scada_outputs_data:
            self._repo_manager.register_custom_repository(
                "scada_outputs",
                ScadaOutputsRepository,
                self._scada_outputs_data
            )

        if self._scada_inputs_data:
            self._repo_manager.register_custom_repository(
                "scada_inputs",
                ScadaInputsRepository,
                self._scada_inputs_data
            )

        logger.info("Repositories configured")

    def initialize_all_repositories(self) -> None:
        self._repo_manager.initialize_all()

    def initialize_repositories(self, repository_names: List[str]) -> None:
        self._repo_manager.initialize_specific(repository_names)

    def get_repository(self, name: str) -> BaseRepository:
        return self._repo_manager.get_repository(name)

    def get_network(self) -> pn.Network:
        return self._network

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            logger.info("Connection closed")