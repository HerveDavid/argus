import pandas as pd

from src.shared.base_repository import BaseRepository

class HvdcLinesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "hvdc_lines"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE hvdc_lines (
                   id                      VARCHAR PRIMARY KEY,
                   name                    VARCHAR,
                   converters_mode         VARCHAR,
                   target_p                DOUBLE,
                   max_p                   DOUBLE,
                   nominal_v               DOUBLE,
                   r                       DOUBLE,
                   converter_station1_id   VARCHAR,
                   converter_station2_id   VARCHAR,
                   connected1              BOOLEAN,
                   connected2              BOOLEAN,
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
                (id, name, converters_mode, target_p, max_p, nominal_v, r, 
                 converter_station1_id, converter_station2_id, connected1, connected2, fictitious)
                SELECT id, name, converters_mode, target_p, max_p, nominal_v, r, 
                       converter_station1_id, converter_station2_id, connected1, connected2, fictitious
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_hvdc_lines(all_attributes=True)