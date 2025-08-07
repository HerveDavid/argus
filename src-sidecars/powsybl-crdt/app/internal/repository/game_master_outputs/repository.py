import pandas as pd
from typing import Dict, Any, List

from app.shared import BaseRepository


class GameMasterOutputsRepository(BaseRepository):

    def __init__(self, conn, network, game_master_outputs_data: List[Dict[str, Any]]):
        super().__init__(conn, network)
        self._game_master_outputs_data = game_master_outputs_data

    def get_table_name(self) -> str:
        return "game_master_outputs"

    def get_table_schema(self) -> str:
        return """
               CREATE TABLE game_master_outputs (
                   id                  VARCHAR PRIMARY KEY,
                   dynawo_id          VARCHAR,
                   model              VARCHAR,
                   variable           VARCHAR,
                   model_lib          VARCHAR,
                   equipment_id       VARCHAR,
                   kind               VARCHAR,
                   voltage_level      VARCHAR,
                   substation         VARCHAR,
                   graphical_id       VARCHAR,
                   iidm_class         VARCHAR,
                   topic              VARCHAR
               )
               """

    def get_network_data(self) -> pd.DataFrame:
        if not self._game_master_outputs_data:
            return pd.DataFrame(columns=[
                'id', 'dynawo_id', 'model', 'variable', 'model_lib',
                'equipment_id', 'kind', 'voltage_level', 'substation',
                'graphical_id', 'iidm_class', 'topic'
            ])

        normalized_data = []
        for entry in self._game_master_outputs_data:
            normalized_entry = {
                'id': entry.get('id'),
                'dynawo_id': entry.get('dynawo_id'),
                'model': entry.get('model'),
                'variable': entry.get('variable'),
                'model_lib': entry.get('model_lib'),
                'equipment_id': entry.get('equipmentId'),
                'kind': entry.get('kind'),
                'voltage_level': entry.get('voltage_level'),
                'substation': entry.get('substation'),
                'graphical_id': entry.get('graphical_id'),
                'iidm_class': entry.get('iidm_class'),
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
                (id, dynawo_id, model, variable, model_lib, equipment_id, kind, 
                 voltage_level, substation, graphical_id, iidm_class, topic)
                SELECT id, dynawo_id, model, variable, model_lib, equipment_id, kind,
                       voltage_level, substation, graphical_id, iidm_class, topic
                FROM {temp_table_name}
            """)

            self._logger.info(f"Data loaded into {self._table_name}: {len(df_reset)} records")

        except Exception as e:
            self._logger.error(f"Error loading data into {self._table_name}: {e}")
            raise