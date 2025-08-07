import pandas as pd

from src.shared.base_repository import BaseRepository

class RatioTapChangersRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "ratio_tap_changers"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE ratio_tap_changers (
                   id                      VARCHAR PRIMARY KEY,
                   side                    VARCHAR,
                   tap                     INTEGER,
                   low_tap                 INTEGER,
                   high_tap                INTEGER,
                   step_count              INTEGER,
                   on_load                 BOOLEAN,
                   regulating              BOOLEAN,
                   target_v                DOUBLE,
                   target_deadband         DOUBLE,
                   regulating_bus_id       VARCHAR,
                   regulated_side          VARCHAR
               )
               """

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_ratio_tap_changers(all_attributes=True)