import pandas as pd

from src.shared.base_repository import BaseRepository

class LinearShuntCompensatorSectionsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "linear_shunt_compensator_sections"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE linear_shunt_compensator_sections (
                   id                      VARCHAR PRIMARY KEY,
                   g_per_section           DOUBLE,
                   b_per_section           DOUBLE,
                   max_section_count       INTEGER
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
                (id, g_per_section, b_per_section, max_section_count)
                SELECT id, g_per_section, b_per_section, max_section_count
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_linear_shunt_compensator_sections(all_attributes=True)