import pandas as pd

from src.shared.base_repository import BaseRepository

class IdentifiablesRepository(BaseRepository):

    def get_table_name(self) -> str:
        return "identifiables"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE identifiables (
                   id     VARCHAR PRIMARY KEY,
                   type   VARCHAR
               )
               """

    def get_network_data(self) -> pd.DataFrame:
        return self._network.get_identifiables(all_attributes=True)