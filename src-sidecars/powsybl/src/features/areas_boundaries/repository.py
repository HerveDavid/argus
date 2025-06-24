import pandas as pd

from src.shared.base_repository import BaseRepository

class AreasBoundariesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "areas_boundaries"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE areas_boundaries (
                   id              VARCHAR,
                   boundary_type   VARCHAR,
                   element         VARCHAR,
                   side            VARCHAR,
                   ac              BOOLEAN,
                   p               DOUBLE,
                   q               DOUBLE,
                   PRIMARY KEY (id, element),
                   FOREIGN KEY (id) REFERENCES areas (id)
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
                (id, boundary_type, element, side, ac, p, q)
                SELECT id, boundary_type, element, side, ac, p, q
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_areas_boundaries(all_attributes=True)