import pandas as pd

from src.shared.base_repository import BaseRepository

class VoltageLevelsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "voltage_levels"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE voltage_levels (
                   id                 VARCHAR PRIMARY KEY,
                   name               VARCHAR,
                   substation_id      VARCHAR,
                   nominal_v          DOUBLE,
                   high_voltage_limit DOUBLE,
                   low_voltage_limit  DOUBLE,
                   fictitious         BOOLEAN,
                   topology_kind      VARCHAR,
                   FOREIGN KEY (substation_id) REFERENCES substations (id)
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
                (id, name, substation_id, nominal_v, high_voltage_limit, low_voltage_limit, fictitious, topology_kind)
                SELECT id, name, substation_id, nominal_v, high_voltage_limit, low_voltage_limit, fictitious, topology_kind 
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_voltage_levels(all_attributes=True)
