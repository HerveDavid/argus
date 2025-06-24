import duckdb as db
import pypowsybl as pp

from typing import Dict, List
from src.shared.base_repository import BaseRepository
from src.utils.logger import get_logger

logger = get_logger(__name__)

class RepositoryManager:

    def __init__(self, conn: db.DuckDBPyConnection, network: pp.network.Network):
        self._conn = conn
        self._network = network
        self._repositories: Dict[str, BaseRepository] = {}

    def register_repository(self, name: str, repository_class: type) -> None:
        if not issubclass(repository_class, BaseRepository):
            raise ValueError("Repository must inherit from BaseRepository")

        self._repositories[name] = repository_class(self._conn, self._network)

    def get_repository(self, name: str) -> BaseRepository:
        if name not in self._repositories:
            raise KeyError(f"Repository '{name}' not found")
        return self._repositories[name]

    def initialize_all(self) -> None:
        for name, repo in self._repositories.items():
            try:
                repo.initialize()
                logger.info(f"Repository '{name}' initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing repository '{name}': {e}")
                raise

    def initialize_specific(self, repository_names: List[str]) -> None:
        for name in repository_names:
            if name in self._repositories:
                self._repositories[name].initialize()
            else:
                logger.warning(f"Repository '{name}' not found")
