import pandas as pd

from src.shared.base_repository import BaseRepository


class RatioTapChangerStepsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "ratio_tap_changer_steps"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE ratio_tap_changer_steps \
               ( \
                   transformer_id VARCHAR, \
                   position       INTEGER, \
                   side           VARCHAR, \
                   rho DOUBLE, \
                   r DOUBLE, \
                   x DOUBLE, \
                   g DOUBLE, \
                   b DOUBLE, \
                   PRIMARY KEY (transformer_id, position)
               )
               """

    def load_data(self) -> None:
        try:
            data_df = self.get_network_data()

            # Handle multi-index DataFrame (id of transformer, position)
            df_reset = data_df.reset_index()

            # Rename index columns to match our schema
            if len(df_reset.columns) >= 2 and 'level_0' in df_reset.columns:
                df_reset = df_reset.rename(columns={
                    'level_0': 'transformer_id',
                    'level_1': 'position'
                })
            elif 'id' in df_reset.columns:
                # If the index is named differently
                index_cols = df_reset.columns[:2].tolist()
                df_reset = df_reset.rename(columns={
                    index_cols[0]: 'transformer_id',
                    index_cols[1]: 'position'
                })

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            # Clear existing data and insert new data
            self._conn.execute(f"DELETE FROM {self._table_name}")

            # Specify column order to match table schema
            self._conn.execute(f"""
                INSERT INTO {self._table_name} 
                (transformer_id, position, side, rho, r, x, g, b)
                SELECT transformer_id, position, side, rho, r, x, g, b
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_ratio_tap_changer_steps(all_attributes=True)