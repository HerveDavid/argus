import duckdb as db
import pypowsybl as pp
from typing import List

from src.app.managers.repository_manager import RepositoryManager
from src.features.aliases.repository import AliasesRepository
from src.features.areas.repository import AreasRepository
from src.features.areas_boundaries.repository import AreasBoundariesRepository
from src.features.areas_voltage_levels.repository import AreasVoltageLevelsRepository
from src.features.bus_breaker_view_buses.repository import BusBreakerViewBusesRepository
from src.features.busbar_sections.repository import BusbarSectionsRepository
from src.features.batteries.repository import BatteriesRepository
from src.features.branches.repository import BranchesRepository
from src.features.buses.repository import BusesRepository
from src.features.dangling_lines.repository import DanglingLinesRepository
from src.features.generators.repository import GeneratorsRepository
from src.features.hvdc_lines.repository import HvdcLinesRepository
from src.features.identifiables.repository import IdentifiablesRepository
from src.features.injections.repository import InjectionsRepository
from src.features.lcc_converter_stations.repository import LccConverterStationsRepository
from src.features.linear_shunt_compensator_sections.repository import LinearShuntCompensatorSectionsRepository
from src.features.lines.repository import LinesRepository
from src.features.loads.repository import LoadsRepository
from src.features.non_linear_shunt_compensator_sections.repository import NonLinearShuntCompensatorSectionsRepository
from src.features.operational_limits.repository import OperationalLimitsRepository
from src.features.phase_tab_changer_steps.repository import PhaseTapChangerStepsRepository
from src.features.phase_tab_changers.repository import PhaseTapChangersRepository
from src.features.ratio_tab_changer_steps.repository import RatioTapChangerStepsRepository
from src.features.ratio_tab_changers.repository import RatioTapChangersRepository
from src.features.reactive_capability_curve_points.repository import ReactiveCapabilityCurvePointsRepository
from src.features.shunt_compensators.repository import ShuntCompensatorsRepository
from src.features.static_var_compensators.repository import StaticVarCompensatorsRepository
from src.features.substations.repository import SubstationsRepository
from src.features.switches.repository import SwitchesRepository
from src.features.terminals.repository import TerminalsRepository
from src.features.three_windings_transformers.repository import ThreeWindingsTransformersRepository
from src.features.tie_lines.repository import TieLinesRepository
from src.features.two_windings_transformers.repository import TwoWindingsTransformersRepository
from src.features.voltage_levels.repository import VoltageLevelsRepository
from src.features.vsc_converter_stations.repository import VscConverterStationsRepository
from src.shared.base_repository import BaseRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)

class RepositoryController:

    def __init__(self, network_path: str, db_path: str):
        self._setup_network(network_path)
        self._setup_database(db_path)
        self._setup_repositories()

    def _setup_network(self, network_path: str) -> None:
        self._network = pp.network.load(network_path)
        logger.info(f"Loaded {network_path}")

    def _setup_database(self, db_path: str) -> None:
        self._conn = db.connect(db_path)
        logger.info(f"Database connection established: {db_path}")

    def _setup_repositories(self) -> None:
        self._repo_manager = RepositoryManager(self._conn, self._network)

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

        logger.info("Repositories configured")

    def initialize_all_repositories(self) -> None:
        self._repo_manager.initialize_all()

    def initialize_repositories(self, repository_names: List[str]) -> None:
        self._repo_manager.initialize_specific(repository_names)

    def get_repository(self, name: str) -> BaseRepository:
        return self._repo_manager.get_repository(name)

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            logger.info("Connection closed")