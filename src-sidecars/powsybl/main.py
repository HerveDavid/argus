import logging
import asyncio
import hypercorn.asyncio
import hypercorn.config
from quart import Quart

from domain.network.services.network_service import NetworkService
from interfaces.api.routes import register_api_routes
from interfaces.sse.routes import register_sse_routes


async def create_app():
    """Factory function to create and initialize the application."""
    # Create app
    app = Quart(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 Mo

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Initialize services
    network_service = NetworkService()

    # Try to load the last network
    result = await network_service.load_last_network()
    if result:
        app.logger.warning(f"Could not load previous network: {result}")
    else:
        app.logger.info("Previous network loaded successfully")

    # Clean up old network files
    await network_service.cleanup_old_networks(max_files=5)

    # Register all routes
    register_sse_routes(app)
    register_api_routes(app, network_service)

    return app


if __name__ == "__main__":
    # Hypercorn configuration
    config = hypercorn.config.Config()
    config.h2_protocol = True
    config.insecure_bind = ["0.0.0.0:8000"]
    config.alpn_protocols = ["h2c", "http/1.1"]
    config.read_timeout = 300
    config.write_timeout = 300
    config.request_max_size = 500 * 1024 * 1024  # 500 Mo
    config.timeout_keep_alive = 600  # 10 minutes
    config.worker_class = "asyncio"  # Use asyncio for stability
    config.graceful_timeout = 300.0
    config.keep_alive_timeout = 300.0

    # Create and run app with modern asyncio approach
    async def main():
        app = await create_app()
        await hypercorn.asyncio.serve(app, config)

    asyncio.run(main())
