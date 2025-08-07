import pandas as pd
from typing import Dict, Any, List, Optional

from app.shared import BaseRepository


class ScadaOutputsRepository(BaseRepository):

    def __init__(self, conn, network, scada_outputs_data: List[Dict[str, Any]]):
        super().__init__(conn, network)
        self._scada_outputs_data = scada_outputs_data

    def get_table_name(self) -> str:
        return "scada_outputs"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE scada_outputs \
               ( \
                   id                VARCHAR PRIMARY KEY, \
                   dynawo_id         VARCHAR, \
                   tase2             VARCHAR, \
                   source            VARCHAR, \
                   destination       VARCHAR, \
                   topic             VARCHAR, \
                   graphical_id      VARCHAR, \
                   publish_on_change BOOLEAN
               )
               """

    def get_network_data(self) -> pd.DataFrame:
        if not self._scada_outputs_data:
            return pd.DataFrame(columns=[
                'id', 'dynawo_id', 'tase2', 'source', 'destination',
                'topic', 'graphical_id', 'publish_on_change'
            ])

        normalized_data = []
        for entry in self._scada_outputs_data:
            normalized_entry = {
                'id': entry.get('id'),
                'dynawo_id': entry.get('dynawo_id'),
                'tase2': entry.get('tase2'),
                'source': entry.get('source'),
                'destination': entry.get('destination'),
                'topic': entry.get('topic'),
                'graphical_id': entry.get('graphical_id'),
                'publish_on_change': entry.get('publish_on_change')
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
                (id, dynawo_id, tase2, source, destination, topic, graphical_id, publish_on_change)
                SELECT id, dynawo_id, tase2, source, destination, topic, graphical_id, publish_on_change
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise
