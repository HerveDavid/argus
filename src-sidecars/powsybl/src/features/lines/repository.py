import pandas as pd

from src.shared.base_repository import BaseRepository

class LinesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "lines"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE lines (
                   id                        VARCHAR PRIMARY KEY,
                   name                      VARCHAR,
                   r                         DOUBLE,
                   x                         DOUBLE,
                   g1                        VARCHAR,
                   b1                        VARCHAR,
                   g2                        VARCHAR,
                   b2                        VARCHAR,
                   p1                        VARCHAR,
                   q1                        VARCHAR,
                   i1                        VARCHAR,
                   p2                        VARCHAR,
                   q2                        VARCHAR,
                   i2                        VARCHAR,
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

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_lines(all_attributes=True)