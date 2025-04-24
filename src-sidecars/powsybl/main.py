import asyncio
import logging
from domain.network import NetworkService
from interfaces import zmq_server

async def main():
    """Main entry point for the ZMQ server."""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger("main")
    
    # Create network service
    network_service = NetworkService()
    
    # Start ZMQ server
    logger.info("Starting ZMQ server...")
    await zmq_server(network_service, bind_address="tcp://localhost:5555")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer shutting down...")