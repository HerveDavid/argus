from src.app.controllers.repository_controller import RepositoryController
from src.features.dynawo.controller import DynawoController
import json
from pathlib import Path

if __name__ == "__main__":
    repository_controller = RepositoryController(
        "/home/herved/Projects/TwinEu/Argus/TwinEU-core/docs/orchestrator/examples/scenario_MQIS_NB/scenario_MQIS_NB.iidm", 
        "~/network.db"
    )
    repository_controller.initialize_all_repositories()
    
    base_path = Path("/home/herved/Projects/TwinEu/Argus/TwinEU-core/docs/orchestrator/examples/scenario_MQIS_NB")
    game_master_file = base_path / "dynawo_game_master_outputs_test.json"
    scada_file = base_path / "dynawo_scada_outputs.json"
   
    try:
        # Initialiser le DynawoController
        print("Initializing DynawoController...")
        print(f"Loading from files:")
        print(f"  - Game Master: {game_master_file}")
        print(f"  - SCADA: {scada_file}")
        
        dynawo_controller = DynawoController(
            db_path="~/network.db",
            game_master_file_path=str(game_master_file),
            scada_file_path=str(scada_file)
        )
        dynawo_controller.initialize_tables()
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Nettoyage
        try:
            if 'dynawo_controller' in locals():
                dynawo_controller.close()
            repository_controller.close()
        except:
            pass
        
        print("\nTest completed.")