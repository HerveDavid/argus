from src.app.controllers.repository_controller import RepositoryController

if __name__ == "__main__":
    repository_controller = RepositoryController("/home/herved/Projects/TwinEu/Argus/TwinEU-core/docs/orchestrator/examples/scenario_MQIS_NB/scenario_MQIS_NB.iidm", "~/network.db")
    repository_controller.initialize_all_repositories()