import pandas as pd

from src.shared.base_repository import BaseRepository


class ReactiveCapabilityCurvePointsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "reactive_capability_curve_points"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE reactive_capability_curve_points \
               ( \
                   generator_id VARCHAR, \
                   num          INTEGER, \
                   p DOUBLE, \
                   min_q DOUBLE, \
                   max_q DOUBLE, \
                   PRIMARY KEY (generator_id, num)
               )
               """

    def load_data(self) -> None:
        try:
            data_df = self.get_network_data()

            # Handle DataFrame indexed on generator ID with num as additional identifier
            df_reset = data_df.reset_index()

            # Rename index column to match our schema
            if 'level_0' in df_reset.columns:
                df_reset = df_reset.rename(columns={
                    'level_0': 'generator_id'
                })
            elif 'id' in df_reset.columns:
                # If the index is named 'id'
                df_reset = df_reset.rename(columns={
                    'id': 'generator_id'
                })
            else:
                # If the first column is the generator ID
                first_col = df_reset.columns[0]
                if first_col != 'generator_id':
                    df_reset = df_reset.rename(columns={
                        first_col: 'generator_id'
                    })

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            # Clear existing data and insert new data
            self._conn.execute(f"DELETE FROM {self._table_name}")

            # Specify column order to match table schema
            self._conn.execute(f"""
                INSERT INTO {self._table_name} 
                (generator_id, num, p, min_q, max_q)
                SELECT generator_id, num, p, min_q, max_q
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_reactive_capability_curve_points(all_attributes=True)