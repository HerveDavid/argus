import pandas as pd

from src.shared.base_repository import BaseRepository

class ShuntCompensatorsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "shunt_compensators"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE shunt_compensators (
                   id                      VARCHAR PRIMARY KEY,
                   model_type              VARCHAR,
                   max_section_count       INTEGER,
                   section_count           INTEGER,
                   p                       DOUBLE,
                   q                       DOUBLE,
                   i                       DOUBLE,
                   voltage_level_id        VARCHAR,
                   bus_id                  VARCHAR,
                   bus_breaker_bus_id      VARCHAR,
                   node                    INTEGER,
                   connected               BOOLEAN,
                   fictitious              BOOLEAN
               )
               """

    def load_data(self) -> None:
        try:
            data_df = self.get_network_data()
            df_reset = data_df.reset_index()

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            # Specify column order to match table schema
            self._conn.execute(f"""
                INSERT OR REPLACE INTO {self._table_name}
                (id, model_type, max_section_count, section_count, p, q, i,
                 voltage_level_id, bus_id, bus_breaker_bus_id, node, connected, fictitious)
                SELECT id, model_type, max_section_count, section_count, p, q, i,
                       voltage_level_id, bus_id, bus_breaker_bus_id, node, connected, fictitious
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_shunt_compensators(all_attributes=True)