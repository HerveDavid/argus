import pandas as pd

from src.shared.base_repository import BaseRepository

class TwoWindingsTransformersRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "two_windings_transformers"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE two_windings_transformers (
                   id                        VARCHAR PRIMARY KEY,
                   name                      VARCHAR,
                   r                         DOUBLE,
                   x                         DOUBLE,
                   g                         DOUBLE,
                   b                         DOUBLE,
                   rated_u1                  DOUBLE,
                   rated_u2                  DOUBLE,
                   rated_s                   DOUBLE,
                   p1                        DOUBLE,
                   q1                        DOUBLE,
                   i1                        DOUBLE,
                   p2                        DOUBLE,
                   q2                        DOUBLE,
                   i2                        DOUBLE,
                   voltage_level1_id         VARCHAR,
                   voltage_level2_id         VARCHAR,
                   bus1_id                   VARCHAR,
                   bus2_id                   VARCHAR,
                   bus_breaker_bus1_id       VARCHAR,
                   bus_breaker_bus2_id       VARCHAR,
                   node1                     VARCHAR,
                   node2                     VARCHAR,
                   connected1                BOOLEAN,
                   connected2                BOOLEAN,
                   fictitious                BOOLEAN,
                   selected_limits_group_1   VARCHAR,
                   selected_limits_group_2   VARCHAR,
                   FOREIGN KEY (voltage_level1_id) REFERENCES voltage_levels (id),
                   FOREIGN KEY (voltage_level2_id) REFERENCES voltage_levels (id)
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
                (id, name, r, x, g, b, rated_u1, rated_u2, rated_s, p1, q1, i1, p2, q2, i2, 
                 voltage_level1_id, voltage_level2_id, bus1_id, bus2_id, bus_breaker_bus1_id, 
                 bus_breaker_bus2_id, node1, node2, connected1, connected2, fictitious, 
                 selected_limits_group_1, selected_limits_group_2)
                SELECT id, name, r, x, g, b, rated_u1, rated_u2, rated_s, p1, q1, i1, p2, q2, i2, 
                       voltage_level1_id, voltage_level2_id, bus1_id, bus2_id, bus_breaker_bus1_id, 
                       bus_breaker_bus2_id, node1, node2, connected1, connected2, fictitious, 
                       selected_limits_group_1, selected_limits_group_2
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_2_windings_transformers(all_attributes=True)