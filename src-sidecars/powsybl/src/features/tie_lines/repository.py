import pandas as pd

from src.shared.base_repository import BaseRepository

class TieLinesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "tie_lines"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE tie_lines (
                   id                      VARCHAR PRIMARY KEY,
                   dangling_line1_id       VARCHAR,
                   dangling_line2_id       VARCHAR,
                   ucte_xnode_code         VARCHAR,
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
                (id, dangling_line1_id, dangling_line2_id, ucte_xnode_code, fictitious)
                SELECT id, dangling_line1_id, dangling_line2_id, ucte_xnode_code, fictitious
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_tie_lines(all_attributes=True)