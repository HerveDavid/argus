import pandas as pd

from src.shared.base_repository import BaseRepository


class NonLinearShuntCompensatorSectionsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "non_linear_shunt_compensator_sections"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE non_linear_shunt_compensator_sections \
               ( \
                   shunt_id       VARCHAR, \
                   section_number INTEGER, \
                   g DOUBLE, \
                   b DOUBLE, \
                   PRIMARY KEY (shunt_id, section_number)
               )
               """

    def load_data(self) -> None:
        try:
            data_df = self.get_network_data()

            # Handle multi-index DataFrame (id of shunt, section number)
            df_reset = data_df.reset_index()

            # Rename index columns to match our schema
            if len(df_reset.columns) >= 2 and 'level_0' in df_reset.columns:
                df_reset = df_reset.rename(columns={
                    'level_0': 'shunt_id',
                    'level_1': 'section_number'
                })
            elif 'id' in df_reset.columns:
                # If the index is named differently
                index_cols = df_reset.columns[:2].tolist()
                df_reset = df_reset.rename(columns={
                    index_cols[0]: 'shunt_id',
                    index_cols[1]: 'section_number'
                })

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            # Specify column order to match table schema
            self._conn.execute(f"""
                INSERT OR REPLACE INTO {self._table_name} 
                (shunt_id, section_number, g, b)
                SELECT shunt_id, section_number, g, b
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_non_linear_shunt_compensator_sections(all_attributes=True)