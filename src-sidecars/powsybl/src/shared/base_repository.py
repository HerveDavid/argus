import duckdb as db
import pypowsybl as pp
import pandas as pd

from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod

from src.utils.logger import get_logger


class BaseRepository(ABC):
    """Classe de base pour tous les repositories avec méthodes utilitaires"""

    def __init__(self, conn: db.DuckDBPyConnection, network: pp.network.Network):
        self._conn = conn
        self._network = network
        self._table_name = self.get_table_name()
        self._logger = get_logger(f"{self.__class__.__module__}.{self.__class__.__name__}")

    @abstractmethod
    def get_table_name(self) -> str:
        pass

    @abstractmethod
    def get_table_schema(self) -> str:
        pass

    @abstractmethod
    def get_network_data(self) -> pd.DataFrame:
        pass

    def table_exists(self, table_name: Optional[str] = None) -> bool:
        """Vérifie si la table existe"""
        table_name = table_name or self._table_name
        try:
            result = self._conn.execute(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?",
                [table_name]
            ).fetchone()
            return result[0] > 0 if result else False
        except Exception as e:
            self._logger.warning(f"Error checking table {table_name}: {e}")
            return False

    def create_table(self) -> None:
        """Crée la table"""
        try:
            self._conn.execute(self.get_table_schema())
            self._logger.info(f"Table {self._table_name} created successfully")
        except Exception as e:
            self._logger.error(f"Error creating table {self._table_name}: {e}")
            raise

    def load_data(self) -> None:
        """Charge les données dans la table"""
        try:
            data_df = self.get_network_data()
            df_reset = data_df.reset_index()

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            self._conn.execute(f"""
                INSERT OR REPLACE INTO {self._table_name}
                SELECT * FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def drop_table(self) -> None:
        """Supprime la table"""
        try:
            self._conn.execute(f"DROP TABLE IF EXISTS {self._table_name}")
            self._logger.info(f"Table {self._table_name} dropped")
        except Exception as e:
            self._logger.error(f"Error dropping table {self._table_name}: {e}")
            raise

    def reset_table(self) -> None:
        """Recrée la table et recharge les données"""
        self.drop_table()
        self.create_table()
        self.load_data()

    def ensure_table_exists(self) -> 'BaseRepository':
        """S'assure que la table existe"""
        if not self.table_exists():
            self.create_table()
        return self

    def initialize(self) -> None:
        """Initialise le repository"""
        try:
            self.ensure_table_exists()
            self.load_data()
            self._logger.info(f"Repository {self.__class__.__name__} initialized successfully")
        except Exception as e:
            self._logger.error(f"Error initializing repository {self.__class__.__name__}: {e}")
            raise

    # Méthodes utilitaires pour les requêtes
    def count(self) -> int:
        """Retourne le nombre d'enregistrements dans la table"""
        try:
            if not self.table_exists():
                return 0

            result = self._conn.execute(f"SELECT COUNT(*) FROM {self._table_name}").fetchone()
            return result[0] if result else 0
        except Exception as e:
            self._logger.error(f"Error counting records in {self._table_name}: {e}")
            return 0

    def get_all(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Retourne tous les enregistrements (avec limite optionnelle)"""
        try:
            if not self.table_exists():
                return []

            query = f"SELECT * FROM {self._table_name}"
            if limit:
                query += f" LIMIT {limit}"

            result = self._conn.execute(query).fetchdf()
            return result.to_dict('records')
        except Exception as e:
            self._logger.error(f"Error getting all records from {self._table_name}: {e}")
            return []

    def get_by_id(self, id_value: str) -> Optional[Dict[str, Any]]:
        """Retourne un enregistrement par son ID"""
        try:
            if not self.table_exists():
                return None

            result = self._conn.execute(
                f"SELECT * FROM {self._table_name} WHERE id = ?",
                [id_value]
            ).fetchdf()

            if result.empty:
                return None

            return result.iloc[0].to_dict()
        except Exception as e:
            self._logger.error(f"Error getting record by id {id_value} from {self._table_name}: {e}")
            return None

    def search(self, filters: Dict[str, Any], limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Recherche avec filtres"""
        try:
            if not self.table_exists() or not filters:
                return []

            where_clauses = []
            params = []

            for column, value in filters.items():
                if value is not None:
                    where_clauses.append(f"{column} = ?")
                    params.append(value)

            if not where_clauses:
                return self.get_all(limit)

            query = f"SELECT * FROM {self._table_name} WHERE {' AND '.join(where_clauses)}"
            if limit:
                query += f" LIMIT {limit}"

            result = self._conn.execute(query, params).fetchdf()
            return result.to_dict('records')
        except Exception as e:
            self._logger.error(f"Error searching in {self._table_name}: {e}")
            return []

    def get_columns(self) -> List[str]:
        """Retourne la liste des colonnes de la table"""
        try:
            if not self.table_exists():
                return []

            result = self._conn.execute(f"DESCRIBE {self._table_name}").fetchdf()
            return result['column_name'].tolist()
        except Exception as e:
            self._logger.error(f"Error getting columns for {self._table_name}: {e}")
            return []

    def execute_query(self, query: str, params: Optional[List] = None) -> List[Dict[str, Any]]:
        """Exécute une requête personnalisée"""
        try:
            if params:
                result = self._conn.execute(query, params).fetchdf()
            else:
                result = self._conn.execute(query).fetchdf()

            return result.to_dict('records')
        except Exception as e:
            self._logger.error(f"Error executing custom query: {e}")
            return []

    def get_table_info(self) -> Dict[str, Any]:
        """Retourne des informations sur la table"""
        return {
            "table_name": self._table_name,
            "exists": self.table_exists(),
            "count": self.count() if self.table_exists() else 0,
            "columns": self.get_columns()
        }