import pandas as pd

from src.shared.base_repository import BaseRepository

class VscConverterStationsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "vsc_converter_stations"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE vsc_converter_stations (
                   id                      VARCHAR PRIMARY KEY,
                   loss_factor             DOUBLE,
                   target_v                DOUBLE,
                   target_q                DOUBLE,
                   max_q                   DOUBLE,
                   min_q                   DOUBLE,
                   max_q_at_p              DOUBLE,
                   min_q_at_p              DOUBLE,
                   reactive_limits_kind    VARCHAR,
                   voltage_regulator_on    BOOLEAN,
                   regulated_element_id    VARCHAR,
                   p                       DOUBLE,
                   q                       DOUBLE,
                   i                       DOUBLE,
                   voltage_level_id        VARCHAR,
                   bus_id                  VARCHAR,
                   bus_breaker_bus_id      VARCHAR,
                   node                    INTEGER,
                   connected               BOOLEAN,
                   fictitious              BOOLEAN
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
                (id, loss_factor, target_v, target_q, max_q, min_q, max_q_at_p, min_q_at_p, 
                 reactive_limits_kind, voltage_regulator_on, regulated_element_id, p, q, i, 
                 voltage_level_id, bus_id, bus_breaker_bus_id, node, connected, fictitious)
                SELECT id, loss_factor, target_v, target_q, max_q, min_q, max_q_at_p, min_q_at_p, 
                       reactive_limits_kind, voltage_regulator_on, regulated_element_id, p, q, i, 
                       voltage_level_id, bus_id, bus_breaker_bus_id, node, connected, fictitious
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_vsc_converter_stations(all_attributes=True)