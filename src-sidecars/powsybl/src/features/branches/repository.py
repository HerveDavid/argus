import pandas as pd

from src.shared.base_repository import BaseRepository

class BranchesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "branches"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE branches (
                   id                        VARCHAR PRIMARY KEY,
                   type                      VARCHAR,
                   voltage_level1_id         VARCHAR,
                   node1                     VARCHAR,
                   bus_breaker_bus1_id       VARCHAR,
                   connected1                BOOLEAN,
                   bus1_id                   VARCHAR,
                   voltage_level2_id         VARCHAR,
                   node2                     VARCHAR,
                   bus_breaker_bus2_id       VARCHAR,
                   connected2                BOOLEAN,
                   bus2_id                   VARCHAR,
                   p1                        DOUBLE,
                   q1                        DOUBLE,
                   i1                        DOUBLE,
                   p2                        DOUBLE,
                   q2                        DOUBLE,
                   i2                        DOUBLE,
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
                (id, type, voltage_level1_id, node1, bus_breaker_bus1_id, connected1, bus1_id,
                 voltage_level2_id, node2, bus_breaker_bus2_id, connected2, bus2_id,
                 p1, q1, i1, p2, q2, i2, selected_limits_group_1, selected_limits_group_2)
                SELECT id, type, voltage_level1_id, node1, bus_breaker_bus1_id, connected1, bus1_id,
                       voltage_level2_id, node2, bus_breaker_bus2_id, connected2, bus2_id,
                       p1, q1, i1, p2, q2, i2, selected_limits_group_1, selected_limits_group_2
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_branches(all_attributes=True)