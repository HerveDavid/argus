import pandas as pd

from src.shared.base_repository import BaseRepository

class AreasRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "areas"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE areas (
                   id                  VARCHAR PRIMARY KEY,
                   name                VARCHAR,
                   area_type           VARCHAR,
                   interchange_target  DOUBLE,
                   interchange         DOUBLE,
                   ac_interchange      DOUBLE,
                   dc_interchange      DOUBLE,
                   fictitious          BOOLEAN
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
                (id, name, area_type, interchange_target, interchange, ac_interchange, dc_interchange, fictitious)
                SELECT id, name, area_type, interchange_target, interchange, ac_interchange, dc_interchange, fictitious
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_areas(all_attributes=True)