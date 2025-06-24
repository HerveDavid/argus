import pandas as pd

from src.shared.base_repository import BaseRepository

class DanglingLinesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "dangling_lines"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE dangling_lines (
                   id                    VARCHAR PRIMARY KEY,
                   name                  VARCHAR,
                   r                     DOUBLE,
                   x                     DOUBLE,
                   g                     DOUBLE,
                   b                     DOUBLE,
                   p0                    DOUBLE,
                   q0                    DOUBLE,
                   p                     DOUBLE,
                   q                     DOUBLE,
                   i                     DOUBLE,
                   boundary_p            DOUBLE,
                   boundary_q            DOUBLE,
                   boundary_i            DOUBLE,
                   boundary_v_mag        DOUBLE,
                   boundary_v_angle      DOUBLE,
                   voltage_level_id      VARCHAR,
                   bus_id                VARCHAR,
                   bus_breaker_bus_id    VARCHAR,
                   node                  VARCHAR,
                   connected             BOOLEAN,
                   fictitious            BOOLEAN,
                   pairing_key           VARCHAR,
                   ucte_xnode_code       VARCHAR,
                   paired                BOOLEAN,
                   tie_line_id           VARCHAR
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
                (id, name, r, x, g, b, p0, q0, p, q, i, boundary_p, boundary_q, boundary_i, 
                 boundary_v_mag, boundary_v_angle, voltage_level_id, bus_id, bus_breaker_bus_id, 
                 node, connected, fictitious, pairing_key, ucte_xnode_code, paired, tie_line_id)
                SELECT id, name, r, x, g, b, p0, q0, p, q, i, boundary_p, boundary_q, boundary_i, 
                       boundary_v_mag, boundary_v_angle, voltage_level_id, bus_id, bus_breaker_bus_id, 
                       node, connected, fictitious, pairing_key, ucte_xnode_code, paired, tie_line_id
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_dangling_lines(all_attributes=True)