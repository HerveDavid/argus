import pandas as pd

from src.shared.base_repository import BaseRepository


class OperationalLimitsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "operational_limits"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE operational_limits \
               ( \
                   id                  INTEGER PRIMARY KEY, \
                   element_id          VARCHAR, \
                   element_type        VARCHAR, \
                   side                VARCHAR, \
                   name                VARCHAR, \
                   type                VARCHAR, \
                   value DOUBLE, \
                   acceptable_duration INTEGER, \
                   fictitious          BOOLEAN, \
                   group_name          VARCHAR, \
                   selected            BOOLEAN
               )
               """

    def load_data(self) -> None:
        try:
            data_df = self.get_network_data()
            df_reset = data_df.reset_index()

            # Add an auto-incrementing ID since element_id is not unique
            df_reset = df_reset.reset_index(drop=True)
            df_reset['id'] = df_reset.index + 1

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            # Clear existing data and insert new data
            self._conn.execute(f"DELETE FROM {self._table_name}")

            # Specify column order to match table schema
            self._conn.execute(f"""
                INSERT INTO {self._table_name} 
                (id, element_id, element_type, side, name, type, value, 
                 acceptable_duration, fictitious, group_name, selected)
                SELECT id, element_id, element_type, side, name, type, value, 
                       acceptable_duration, fictitious, group_name, selected
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_operational_limits(all_attributes=True, show_inactive_sets=True)