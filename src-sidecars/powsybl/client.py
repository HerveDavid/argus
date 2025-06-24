import asyncio
import json
import subprocess
import sys
import uuid
from typing import Dict, Any, Optional, List
from pathlib import Path
import pandas as pd

from src.utils.logger import get_logger, LoggerConfig

logger = get_logger(__name__)


class PowerSystemClient:
    """Client Python pour interagir avec le serveur de données électriques"""

    def __init__(self, server_script: str = "server.py"):
        self.server_script = server_script
        self.process: Optional[subprocess.Popen] = None
        self.is_connected = False

    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()

    def connect(self) -> bool:
        """Démarre le serveur et établit la connexion"""
        try:
            logger.info(f"Démarrage du serveur: {self.server_script}")

            self.process = subprocess.Popen(
                [sys.executable, self.server_script],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
            )

            # Lire le message de démarrage avec timeout
            import select
            import time

            timeout = 5  # 5 secondes timeout
            start_time = time.time()

            while time.time() - start_time < timeout:
                if select.select([self.process.stdout], [], [], 0.1)[0]:
                    startup_line = self.process.stdout.readline()
                    if startup_line:
                        try:
                            startup_line = startup_line.strip()
                            if startup_line:
                                startup_msg = json.loads(startup_line)
                                if startup_msg.get("type") == "startup":
                                    logger.info(
                                        f"Serveur démarré: {startup_msg.get('message')}"
                                    )
                                    self.is_connected = True
                                    return True
                        except json.JSONDecodeError as e:
                            logger.debug(
                                f"Message non JSON ignoré: {startup_line[:100]}"
                            )
                            continue

                # Vérifier si le processus est encore en vie
                if self.process.poll() is not None:
                    logger.error("Le serveur s'est arrêté prématurément")
                    return False

            logger.error("Timeout lors de l'attente du message de démarrage")
            return False

        except Exception as e:
            logger.error(f"Erreur lors de la connexion au serveur: {e}")
            return False

    def disconnect(self):
        """Ferme la connexion au serveur"""
        if self.process:
            try:
                self.process.stdin.close()
                self.process.wait(timeout=5)
                logger.info("Serveur fermé proprement")
            except subprocess.TimeoutExpired:
                self.process.kill()
                logger.warning("Serveur forcé à fermer")
            except Exception as e:
                logger.error(f"Erreur lors de la fermeture: {e}")
            finally:
                self.process = None
                self.is_connected = False

    def _send_request(
        self, method: str, params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Envoie une requête au serveur et retourne la réponse"""
        if not self.is_connected or not self.process:
            raise ConnectionError("Pas de connexion au serveur")

        request_id = str(uuid.uuid4())
        request = {"id": request_id, "method": method, "params": params or {}}

        try:
            # Envoyer la requête
            request_json = json.dumps(request) + "\n"
            self.process.stdin.write(request_json)
            self.process.stdin.flush()

            # Lire la réponse
            response_line = self.process.stdout.readline()
            if not response_line:
                raise ConnectionError("Pas de réponse du serveur")

            response = json.loads(response_line.strip())

            if response.get("id") != request_id:
                raise ValueError("ID de réponse ne correspond pas")

            return response

        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de la requête {method}: {e}")
            raise

    def load_network(self, file_path: str) -> Dict[str, Any]:
        """Charge un fichier réseau (IIDM/XIIDM/JIIDM)"""
        return self._send_request("load_network", {"file_path": file_path})

    def set_database(self, db_path: str) -> Dict[str, Any]:
        """Configure le chemin de la base de données"""
        return self._send_request("set_database", {"db_path": db_path})

    def reset_database(self) -> Dict[str, Any]:
        """Recrée la base de données avec toutes les tables"""
        return self._send_request("reset_database")

    def execute_query(self, query: str) -> Dict[str, Any]:
        """Exécute une requête SQL"""
        return self._send_request("execute_query", {"query": query})

    def load_all(self, file_path: str, db_path: str = "network.db") -> Dict[str, Any]:
        """Charge tout en une fois : réseau + base de données"""
        return self._send_request(
            "load_all", {"file_path": file_path, "db_path": db_path}
        )

    # Méthodes utilitaires de haut niveau

    def quick_setup(self, iidm_file: str, db_file: str = "network.db") -> bool:
        """Configuration rapide : charge le réseau et crée la base de données"""
        try:
            logger.info(f"Configuration rapide avec {iidm_file}")
            response = self.load_all(iidm_file, db_file)

            if response.get("status") == 200 and response.get("result", {}).get(
                "success"
            ):
                logger.info("Configuration rapide réussie")
                return True
            else:
                logger.error(
                    f"Échec de la configuration: {response.get('result', {}).get('error')}"
                )
                return False

        except Exception as e:
            logger.error(f"Erreur lors de la configuration rapide: {e}")
            return False

    def get_network_summary(self) -> pd.DataFrame:
        """Obtient un résumé du réseau électrique"""
        queries = {
            "Substations": "SELECT COUNT(*) as count FROM substations",
            "Voltage Levels": "SELECT COUNT(*) as count FROM voltage_levels",
            "Buses": "SELECT COUNT(*) as count FROM buses",
            "Lines": "SELECT COUNT(*) as count FROM lines",
            "Transformers (2W)": "SELECT COUNT(*) as count FROM two_windings_transformers",
            "Transformers (3W)": "SELECT COUNT(*) as count FROM three_windings_transformers",
            "Generators": "SELECT COUNT(*) as count FROM generators",
            "Loads": "SELECT COUNT(*) as count FROM loads",
            "Batteries": "SELECT COUNT(*) as count FROM batteries",
            "Shunt Compensators": "SELECT COUNT(*) as count FROM shunt_compensators",
        }

        summary_data = []
        for element_type, query in queries.items():
            try:
                response = self.execute_query(query)
                if response.get("status") == 200:
                    count = response["result"]["data"][0]["count"]
                    summary_data.append({"Element": element_type, "Count": count})
                else:
                    summary_data.append({"Element": element_type, "Count": "Error"})
            except:
                summary_data.append({"Element": element_type, "Count": "N/A"})

        return pd.DataFrame(summary_data)

    def get_table_data(self, table_name: str, limit: int = 100) -> pd.DataFrame:
        """Récupère les données d'une table sous forme de DataFrame"""
        try:
            query = f"SELECT * FROM {table_name} LIMIT {limit}"
            response = self.execute_query(query)

            if response.get("status") == 200:
                data = response["result"]["data"]
                return pd.DataFrame(data)
            else:
                logger.error(
                    f"Erreur lors de la récupération de {table_name}: {response.get('result', {}).get('error')}"
                )
                return pd.DataFrame()

        except Exception as e:
            logger.error(f"Erreur lors de la récupération de {table_name}: {e}")
            return pd.DataFrame()

    def get_substations(self, limit: int = 100) -> pd.DataFrame:
        """Récupère la liste des postes électriques"""
        return self.get_table_data("substations", limit)

    def get_generators(self, limit: int = 100) -> pd.DataFrame:
        """Récupère la liste des générateurs"""
        return self.get_table_data("generators", limit)

    def get_loads(self, limit: int = 100) -> pd.DataFrame:
        """Récupère la liste des charges"""
        return self.get_table_data("loads", limit)

    def get_lines(self, limit: int = 100) -> pd.DataFrame:
        """Récupère la liste des lignes"""
        return self.get_table_data("lines", limit)

    def search_by_voltage_level(
        self, min_voltage: float = None, max_voltage: float = None
    ) -> pd.DataFrame:
        """Recherche les éléments par niveau de tension"""
        conditions = []
        if min_voltage is not None:
            conditions.append(f"nominal_v >= {min_voltage}")
        if max_voltage is not None:
            conditions.append(f"nominal_v <= {max_voltage}")

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        query = f"""
        SELECT id, name, nominal_v, substation_id
        FROM voltage_levels 
        WHERE {where_clause}
        ORDER BY nominal_v DESC
        """

        try:
            response = self.execute_query(query)
            if response.get("status") == 200:
                return pd.DataFrame(response["result"]["data"])
            else:
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Erreur lors de la recherche par tension: {e}")
            return pd.DataFrame()

    def get_available_tables(self) -> List[str]:
        """Récupère la liste des tables disponibles"""
        try:
            query = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            response = self.execute_query(query)

            if response.get("status") == 200:
                return [row["name"] for row in response["result"]["data"]]
            else:
                return []

        except Exception as e:
            logger.error(f"Erreur lors de la récupération des tables: {e}")
            return []


# Exemple d'utilisation et de test
def main_example():
    """Exemple d'utilisation du client"""

    # Setup logging
    LoggerConfig.setup_logging(level="INFO")

    # Utilisation avec context manager (recommandé)
    with PowerSystemClient("server.py") as client:
        # Configuration rapide
        success = client.quick_setup(
            "./it/samples/scenario_MQIS_NB/scenario_MQIS_NB.iidm"
        )

        if success:
            print("=== RÉSUMÉ DU RÉSEAU ===")
            summary = client.get_network_summary()
            print(summary)

            print("\n=== TABLES DISPONIBLES ===")
            tables = client.get_available_tables()
            print(tables)

            print("\n=== PREMIERS POSTES ===")
            substations = client.get_substations(5)
            print(substations)

            print("\n=== PREMIERS GÉNÉRATEURS ===")
            generators = client.get_generators(5)
            print(
                generators[["id", "name", "energy_source", "max_p", "target_p"]]
                if not generators.empty
                else "Aucun générateur"
            )

            print("\n=== NIVEAUX DE TENSION > 200kV ===")
            hv_levels = client.search_by_voltage_level(min_voltage=200000)
            print(
                hv_levels[["id", "name", "nominal_v"]]
                if not hv_levels.empty
                else "Aucun niveau HT"
            )

            print("\n=== REQUÊTE PERSONNALISÉE ===")
            custom_query = """
            SELECT 
                s.name as substation_name,
                s.country,
                COUNT(vl.id) as voltage_levels_count
            FROM substations s
            LEFT JOIN voltage_levels vl ON s.id = vl.substation_id
            GROUP BY s.id, s.name, s.country
            ORDER BY voltage_levels_count DESC
            LIMIT 5
            """

            response = client.execute_query(custom_query)
            if response.get("status") == 200:
                custom_df = pd.DataFrame(response["result"]["data"])
                print(custom_df)

        else:
            print("Échec de la configuration")


if __name__ == "__main__":
    main_example()
