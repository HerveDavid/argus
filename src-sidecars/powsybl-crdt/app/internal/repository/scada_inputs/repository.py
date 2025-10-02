import pandas as pd
from typing import Dict, Any, List, Optional

from app.shared import BaseRepository


class ScadaInputsRepository(BaseRepository):

    def __init__(self, conn, network, scada_inputs_data: List[Dict[str, Any]]):
        super().__init__(conn, network)
        self._scada_inputs_data = scada_inputs_data

    def get_table_name(self) -> str:
        return "scada_inputs"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE scada_inputs \
               ( \
                   id          VARCHAR PRIMARY KEY, \
                   dynawo_id   VARCHAR, \
                   tase2       VARCHAR, \
                   source      VARCHAR, \
                   destination VARCHAR, \
                   topic       VARCHAR
               )
               """

    def get_network_data(self) -> pd.DataFrame:
        if not self._scada_inputs_data:
            return pd.DataFrame(columns=[
                'id', 'dynawo_id', 'tase2', 'source', 'destination', 'topic'
            ])

        normalized_data = []
        for entry in self._scada_inputs_data:
            normalized_entry = {
                'id': entry.get('id'),
                'dynawo_id': entry.get('dynawo_id'),
                'tase2': entry.get('tase2'),
                'source': entry.get('source'),
                'destination': entry.get('destination'),
                'topic': entry.get('topic')
            }
            normalized_data.append(normalized_entry)

        df = pd.DataFrame(normalized_data)
        df.set_index('id', inplace=True)
        return df

    def load_data(self) -> None:
        try:
            data_df = self.get_network_data()
            df_reset = data_df.reset_index()

            temp_table_name = f"{self._table_name}_temp"
            self._conn.register(temp_table_name, df_reset)

            self._conn.execute(f"""
                INSERT OR REPLACE INTO {self._table_name} 
                (id, dynawo_id, tase2, source, destination, topic)
                SELECT id, dynawo_id, tase2, source, destination, topic
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise