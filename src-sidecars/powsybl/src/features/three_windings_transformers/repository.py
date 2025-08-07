import pandas as pd

from src.shared.base_repository import BaseRepository

class ThreeWindingsTransformersRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "three_windings_transformers"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE three_windings_transformers (
                   id                        VARCHAR PRIMARY KEY,
                   name                      VARCHAR,
                   r1                        DOUBLE,
                   x1                        DOUBLE,
                   g1                        DOUBLE,
                   b1                        DOUBLE,
                   r2                        DOUBLE,
                   x2                        DOUBLE,
                   g2                        DOUBLE,
                   b2                        DOUBLE,
                   r3                        DOUBLE,
                   x3                        DOUBLE,
                   g3                        DOUBLE,
                   b3                        DOUBLE,
                   rated_u1                  DOUBLE,
                   rated_u2                  DOUBLE,
                   rated_u3                  DOUBLE,
                   rated_s1                  DOUBLE,
                   rated_s2                  DOUBLE,
                   rated_s3                  DOUBLE,
                   p1                        DOUBLE,
                   q1                        DOUBLE,
                   i1                        DOUBLE,
                   p2                        DOUBLE,
                   q2                        DOUBLE,
                   i2                        DOUBLE,
                   p3                        DOUBLE,
                   q3                        DOUBLE,
                   i3                        DOUBLE,
                   voltage_level1_id         VARCHAR,
                   voltage_level2_id         VARCHAR,
                   voltage_level3_id         VARCHAR,
                   bus1_id                   VARCHAR,
                   bus2_id                   VARCHAR,
                   bus3_id                   VARCHAR,
                   bus_breaker_bus1_id       VARCHAR,
                   bus_breaker_bus2_id       VARCHAR,
                   bus_breaker_bus3_id       VARCHAR,
                   node1                     VARCHAR,
                   node2                     VARCHAR,
                   node3                     VARCHAR,
                   connected1                BOOLEAN,
                   connected2                BOOLEAN,
                   connected3                BOOLEAN,
                   fictitious                BOOLEAN,
                   selected_limits_group_1   VARCHAR,
                   selected_limits_group_2   VARCHAR,
                   selected_limits_group_3   VARCHAR,
                   FOREIGN KEY (voltage_level1_id) REFERENCES voltage_levels (id),
                   FOREIGN KEY (voltage_level2_id) REFERENCES voltage_levels (id),
                   FOREIGN KEY (voltage_level3_id) REFERENCES voltage_levels (id)
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
                   (id, name, r1, x1, g1, b1, r2, x2, g2, b2, r3, x3, g3, b3,
                    rated_u1, rated_u2, rated_u3, rated_s1, rated_s2, rated_s3,
                    p1, q1, i1, p2, q2, i2, p3, q3, i3,
                    voltage_level1_id, voltage_level2_id, voltage_level3_id,
                    bus1_id, bus2_id, bus3_id, bus_breaker_bus1_id, bus_breaker_bus2_id, bus_breaker_bus3_id,
                    node1, node2, node3, connected1, connected2, connected3, fictitious,
                    selected_limits_group_1, selected_limits_group_2, selected_limits_group_3)
                   SELECT id, name, r1, x1, g1, b1, r2, x2, g2, b2, r3, x3, g3, b3,
                          rated_u1, rated_u2, rated_u3, rated_s1, rated_s2, rated_s3,
                          p1, q1, i1, p2, q2, i2, p3, q3, i3,
                          voltage_level1_id, voltage_level2_id, voltage_level3_id,
                          bus1_id, bus2_id, bus3_id, bus_breaker_bus1_id, bus_breaker_bus2_id, bus_breaker_bus3_id,
                          node1, node2, node3, connected1, connected2, connected3, fictitious,
                          selected_limits_group_1, selected_limits_group_2, selected_limits_group_3
                   FROM {temp_table_name}
               """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_3_windings_transformers(all_attributes=True)