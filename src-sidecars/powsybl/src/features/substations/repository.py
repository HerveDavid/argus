import pandas as pd

from src.shared.base_repository import BaseRepository


class SubstationsRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "substations"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE substations (
                   id         VARCHAR PRIMARY KEY,
                   name       VARCHAR,
                   tso        VARCHAR,
                   geo_tags   VARCHAR,
                   country    VARCHAR,
                   fictitious BOOLEAN
               )
               """

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_substations(all_attributes=True)