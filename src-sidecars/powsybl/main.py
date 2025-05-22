import sys
import asyncio
import logging
from domain.network import NetworkService
from interfaces import (
    zmq_server,
    start_stdin_thread,
    force_close_port,
    check_port_in_use,
)

port = 4267
address = f"tcp://localhost:{port}"


async def main():
    """Main entry point for the ZMQ server with better error handling."""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger("main")

    # Check if port is already in use
    if await check_port_in_use(address):
        logger.warning(f"Port is already in use: {address}")
        if force_close_port(port):
            logger.info(f"Successfully closed existing process on port {port}")
        else:
            logger.error("Failed to close existing process")
            return

    # Create network service
    network_service = NetworkService()
    start_stdin_thread(network_service)

    # Start ZMQ server
    logger.info("Starting ZMQ server...")
    try:
        await zmq_server(network_service, bind_address=address)
    except Exception as e:
        logger.error(f"Error starting server: {e}")
    finally:
        logger.info("Application shutdown complete")
        sys.exit(0)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully...")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        # Ensure all ZMQ resources are cleaned up
        import zmq

        zmq.Context().term()
