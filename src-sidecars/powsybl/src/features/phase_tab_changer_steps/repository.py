import pandas as pd

from src.shared.base_repository import BaseRepository


class PhaseTapChangerStepsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "phase_tap_changer_steps"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE phase_tap_changer_steps \
               ( \
                   transformer_id VARCHAR, \
                   position       INTEGER, \
                   side           VARCHAR, \
                   rho DOUBLE, \
                   alpha DOUBLE, \
                   r DOUBLE, \
                   x DOUBLE, \
                   g DOUBLE, \
                   b DOUBLE, \
                   PRIMARY KEY (transformer_id, position)
               )
               """

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_phase_tap_changer_steps(all_attributes=True)