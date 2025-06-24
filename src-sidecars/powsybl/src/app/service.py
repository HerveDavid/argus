from .services.application_service import ApplicationServiceImpl, ApplicationService
from .services.configuration_service import (
    ConfigurationServiceImpl,
)
from .services.database_service import DatabaseServiceImpl
from .services.network_service import NetworkServiceImpl


def setup_dependency_injection() -> ApplicationService:
    """Setup dependency injection and return ApplicationService"""

    # Create service instances
    config_service = ConfigurationServiceImpl()
    network_service = NetworkServiceImpl()
    database_service = DatabaseServiceImpl(network_service)

    # Create main application service
    app_service = ApplicationServiceImpl(
        config_service, network_service, database_service
    )

    return app_service
