import pandas as pd

from src.shared.base_repository import BaseRepository

class BusBreakerViewBusesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "bus_breaker_view_buses"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE bus_breaker_view_buses (
                   id                      VARCHAR PRIMARY KEY,
                   v_mag                   DOUBLE,
                   v_angle                 DOUBLE,
                   connected_component     INTEGER,
                   synchronous_component   INTEGER,
                   voltage_level_id        VARCHAR,
                   bus_id                  VARCHAR,
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
                (id, v_mag, v_angle, connected_component, synchronous_component, voltage_level_id, bus_id)
                SELECT id, v_mag, v_angle, connected_component, synchronous_component, voltage_level_id, bus_id
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_bus_breaker_view_buses(all_attributes=True)