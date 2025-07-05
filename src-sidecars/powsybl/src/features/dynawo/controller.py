import duckdb as db
import pandas as pd
import json
from typing import Optional, List, Dict, Any
from pathlib import Path

from src.shared.base_repository import BaseRepository
from src.utils.logger import get_logger


class GameMasterOutputRepository(BaseRepository):
    """Repository pour les données Game Master Output de Dynawo"""

    def __init__(self, conn: db.DuckDBPyConnection, game_master_data: List[Dict[str, Any]]):
        # Pas de network ici, on utilise les données JSON
        self._conn = conn
        self._game_master_data = game_master_data
        self._table_name = self.get_table_name()
        self._logger = get_logger(f"{self.__class__.__module__}.{self.__class__.__name__}")

    def load_data(self) -> None:
        """Charge les données dans la table avec ordre des colonnes spécifique"""
        try:
            data_df = self.get_network_data()
            df_reset = data_df.reset_index(drop=True)

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            # Spécifier l'ordre des colonnes pour correspondre au schéma de table
            self._conn.execute(f"""
                INSERT OR REPLACE INTO {self._table_name}
                (id, model, variable, model_lib, equipment_id, kind, voltage_level, 
                 substation, graphical_id, iidm_class, topic, dynawo_id)
                SELECT id, model, variable, model_lib, equipment_id, kind, voltage_level, 
                       substation, graphical_id, iidm_class, topic, dynawo_id
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_table_name(self) -> str:
        return "dynawo_game_master_outputs"

    def get_table_schema(self) -> str:
        """Schéma pour la table Game Master Outputs basé sur les données réelles"""
        return """
        CREATE TABLE IF NOT EXISTS dynawo_game_master_outputs (
            id VARCHAR PRIMARY KEY,
            model VARCHAR,
            variable VARCHAR,
            model_lib VARCHAR,
            equipment_id VARCHAR,
            kind VARCHAR,
            voltage_level VARCHAR,
            substation VARCHAR,
            graphical_id VARCHAR,
            iidm_class VARCHAR,
            topic VARCHAR,
            dynawo_id VARCHAR
        )
        """

    def get_network_data(self) -> pd.DataFrame:
        """Retourne les données depuis le JSON formatées pour la table"""
        df = pd.DataFrame(self._game_master_data)

        column_mapping = {
            'equipementId': 'equipment_id',
            'model_lib': 'model_lib', 
            'voltage_level': 'voltage_level', 
            'graphical_id': 'graphical_id', 
            'iidm_class': 'iidm_class', 
            'dynawo_id': 'dynawo_id' 
        }
        df = df.rename(columns=column_mapping)
        
        required_columns = [
            'id', 'model', 'variable', 'model_lib', 'equipment_id', 
            'kind', 'voltage_level', 'substation', 'graphical_id', 
            'iidm_class', 'topic', 'dynawo_id'
        ]
        
        for col in required_columns:
            if col not in df.columns:
                df[col] = None
                
        return df[required_columns]


class ScadaOutputRepository(BaseRepository):
    """Repository pour les données SCADA Output de Dynawo"""

    def __init__(self, conn: db.DuckDBPyConnection, scada_data: List[Dict[str, Any]]):
        # Pas de network ici, on utilise les données JSON
        self._conn = conn
        self._scada_data = scada_data
        self._table_name = self.get_table_name()
        self._logger = get_logger(f"{self.__class__.__module__}.{self.__class__.__name__}")

    def get_table_name(self) -> str:
        return "dynawo_scada_outputs"

    def get_table_schema(self) -> str:
        """Schéma pour la table SCADA Outputs basé sur les données réelles"""
        return """
        CREATE TABLE IF NOT EXISTS dynawo_scada_outputs (
            id VARCHAR PRIMARY KEY,
            dynawo_id VARCHAR,
            topic VARCHAR,
            source VARCHAR,
            destination VARCHAR
        )
        """

    def load_data(self) -> None:
        """Charge les données dans la table avec ordre des colonnes spécifique"""
        try:
            data_df = self.get_network_data()
            df_reset = data_df.reset_index(drop=True)

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            # Spécifier l'ordre des colonnes pour correspondre au schéma de table
            self._conn.execute(f"""
                INSERT OR REPLACE INTO {self._table_name}
                (id, dynawo_id, topic, source, destination)
                SELECT id, dynawo_id, topic, source, destination
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        """Retourne les données depuis le JSON formatées pour la table"""
        df = pd.DataFrame(self._scada_data)
        # S'assurer que toutes les colonnes nécessaires sont présentes
        required_columns = ['id', 'dynawo_id', 'topic', 'source', 'destination']
        
        for col in required_columns:
            if col not in df.columns:
                df[col] = None
                
        return df[required_columns]


class DynawoController:
    """Contrôleur pour gérer les données Dynawo (Game Master et SCADA outputs)"""

    def __init__(
        self,
        db_path: str,
        game_master_data: Optional[List[Dict[str, Any]]] = None,
        scada_data: Optional[List[Dict[str, Any]]] = None,
        game_master_file_path: Optional[str] = None,
        scada_file_path: Optional[str] = None
    ):
        """
        Initialise le contrôleur Dynawo.
        
        Args:
            db_path: Chemin vers la base de données DuckDB
            game_master_data: Données Game Master (optionnel si game_master_file_path fourni)
            scada_data: Données SCADA (optionnel si scada_file_path fourni)
            game_master_file_path: Chemin vers le fichier JSON Game Master
            scada_file_path: Chemin vers le fichier JSON SCADA
        """
        self._logger = get_logger(__name__)
        self.db_path = db_path
        
        # Créer le répertoire si nécessaire
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Connexion à la base de données
        self._conn = db.connect(db_path)
        
        # Charger les données
        self.game_master_data = self._load_data(
            data=game_master_data,
            file_path=game_master_file_path,
            data_type="Game Master"
        )
        
        self.scada_data = self._load_data(
            data=scada_data,
            file_path=scada_file_path,
            data_type="SCADA"
        )
        
        # Initialiser les repositories
        self.game_master_repository = None
        self.scada_repository = None
        
        if self.game_master_data:
            self.game_master_repository = GameMasterOutputRepository(
                self._conn, self.game_master_data
            )
        
        if self.scada_data:
            self.scada_repository = ScadaOutputRepository(
                self._conn, self.scada_data
            )

    def _load_data(
        self,
        data: Optional[List[Dict[str, Any]]],
        file_path: Optional[str],
        data_type: str
    ) -> Optional[List[Dict[str, Any]]]:
        """Charge les données depuis data ou file_path"""
        
        if data is not None:
            self._logger.info(f"{data_type} data provided directly ({len(data)} records)")
            return data
        
        if file_path:
            try:
                if not Path(file_path).exists():
                    self._logger.warning(f"{data_type} file not found: {file_path}")
                    return None
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                
                self._logger.info(f"{data_type} data loaded from file: {file_path} ({len(loaded_data)} records)")
                return loaded_data
                
            except Exception as e:
                self._logger.error(f"Error loading {data_type} file {file_path}: {e}")
                return None
        
        self._logger.info(f"No {data_type} data provided")
        return None

    def initialize_tables(self) -> None:
        """Initialise toutes les tables Dynawo"""
        try:
            tables_created = []
            
            if self.game_master_repository:
                self.game_master_repository.initialize()
                tables_created.append("dynawo_game_master_outputs")
            
            if self.scada_repository:
                self.scada_repository.initialize()
                tables_created.append("dynawo_scada_outputs")
            
            if tables_created:
                self._logger.info(f"Dynawo tables initialized: {', '.join(tables_created)}")
            else:
                self._logger.warning("No Dynawo data available to initialize tables")
                
        except Exception as e:
            self._logger.error(f"Error initializing Dynawo tables: {e}")
            raise

    def get_game_master_outputs(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Récupère les données Game Master avec filtres optionnels"""
        if not self.game_master_repository:
            return []
        
        if filters:
            return self.game_master_repository.search(filters, limit)
        else:
            return self.game_master_repository.get_all(limit)

    def get_scada_outputs(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Récupère les données SCADA avec filtres optionnels"""
        if not self.scada_repository:
            return []
        
        if filters:
            return self.scada_repository.search(filters, limit)
        else:
            return self.scada_repository.get_all(limit)

    def get_outputs_by_topic(self, topic: str) -> Dict[str, List[Dict[str, Any]]]:
        """Récupère toutes les sorties pour un topic donné"""
        result = {
            "game_master": [],
            "scada": []
        }
        
        if self.game_master_repository:
            result["game_master"] = self.game_master_repository.search({"topic": topic})
        
        if self.scada_repository:
            result["scada"] = self.scada_repository.search({"topic": topic})
        
        return result

    def get_outputs_by_substation(self, substation: str) -> List[Dict[str, Any]]:
        """Récupère les sorties Game Master pour une sous-station donnée"""
        if not self.game_master_repository:
            return []
        
        return self.game_master_repository.search({"substation": substation})

    def get_available_topics(self) -> Dict[str, List[str]]:
        """Retourne la liste des topics disponibles"""
        topics = {
            "game_master": [],
            "scada": []
        }
        
        if self.game_master_repository:
            gm_data = self.game_master_repository.get_all()
            topics["game_master"] = list(set(item.get("topic", "") for item in gm_data if item.get("topic")))
        
        if self.scada_repository:
            scada_data = self.scada_repository.get_all()
            topics["scada"] = list(set(item.get("topic", "") for item in scada_data if item.get("topic")))
        
        return topics

    def get_summary(self) -> Dict[str, Any]:
        """Retourne un résumé des données Dynawo chargées"""
        summary = {
            "db_path": self.db_path,
            "game_master": {
                "available": self.game_master_repository is not None,
                "count": self.game_master_repository.count() if self.game_master_repository else 0,
                "table_exists": self.game_master_repository.table_exists() if self.game_master_repository else False
            },
            "scada": {
                "available": self.scada_repository is not None,
                "count": self.scada_repository.count() if self.scada_repository else 0,
                "table_exists": self.scada_repository.table_exists() if self.scada_repository else False
            }
        }
        
        if self.game_master_repository or self.scada_repository:
            summary["topics"] = self.get_available_topics()
        
        return summary

    def execute_query(self, query: str, params: Optional[List] = None) -> List[Dict[str, Any]]:
        """Exécute une requête SQL personnalisée"""
        try:
            if params:
                result = self._conn.execute(query, params).fetchdf()
            else:
                result = self._conn.execute(query).fetchdf()
            
            return result.to_dict('records')
        except Exception as e:
            self._logger.error(f"Error executing query: {e}")
            return []

    def close(self) -> None:
        """Ferme la connexion à la base de données"""
        try:
            if self._conn:
                self._conn.close()
                self._logger.info("Dynawo database connection closed")
        except Exception as e:
            self._logger.error(f"Error closing database connection: {e}")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()