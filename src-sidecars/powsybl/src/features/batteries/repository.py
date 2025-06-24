import pandas as pd

from src.shared.base_repository import BaseRepository

class BatteriesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "batteries"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE batteries (
                   id                   VARCHAR PRIMARY KEY,
                   name                 VARCHAR,
                   max_p                DOUBLE,
                   min_p                DOUBLE,
                   min_q                DOUBLE,
                   max_q                DOUBLE,
                   target_p             DOUBLE,
                   target_q             DOUBLE,
                   p                    DOUBLE,
                   q                    DOUBLE,
                   i                    DOUBLE,
                   voltage_level_id     VARCHAR,
                   bus_id               VARCHAR,
                   bus_breaker_bus_id   VARCHAR,
                   node                 VARCHAR,
                   connected            BOOLEAN,
                   fictitious           BOOLEAN,
                   FOREIGN KEY (voltage_level_id) REFERENCES voltage_levels (id)
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
                (id, name, max_p, min_p, min_q, max_q, target_p, target_q, p, q, i,
                 voltage_level_id, bus_id, bus_breaker_bus_id, node, connected, fictitious)
                SELECT id, name, max_p, min_p, min_q, max_q, target_p, target_q, p, q, i,
                       voltage_level_id, bus_id, bus_breaker_bus_id, node, connected, fictitious
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_batteries(all_attributes=True)