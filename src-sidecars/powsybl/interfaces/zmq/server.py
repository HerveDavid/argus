import json
import logging
import zmq
import zmq.asyncio
from ..zmq.handler import ZmqHandler


async def zmq_server(network_service, bind_address="tcp://*:5555"):
    """Run the ZMQ server.

    Args:
        network_service: The network service instance
        bind_address: ZMQ socket binding address
    """
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger("zmq_server")

    # Initialize the ZMQ context
    context = zmq.asyncio.Context()

    # Create a REP socket (for request-reply pattern)
    socket = context.socket(zmq.REP)
    socket.bind(bind_address)

    # Create the handler
    handler = ZmqHandler(network_service)

    logger.info(f"ZMQ server started, listening on {bind_address}")

    # Try to load the last network
    result = await network_service.load_last_network()
    if result:
        logger.warning(f"Could not load previous network: {result}")
    else:
        logger.info("Previous network loaded successfully")

    # Clean up old network files
    await network_service.cleanup_old_networks(max_files=5)

    # Main server loop
    try:
        while True:
            # Wait for next request from client
            message = await socket.recv()
            logger.debug(f"Received message: {message[:100]}...")

            try:
                # Parse JSON message
                request = json.loads(message)

                # Process the message
                response = await handler.process_message(request)

                # Send reply back to client
                await socket.send_json(response)

            except json.JSONDecodeError as e:
                # Handle invalid JSON
                error_response = handler._create_error_response(
                    None, 400, f"Invalid JSON: {str(e)}"
                )
                await socket.send_json(error_response)

            except Exception as e:
                # Handle any other errors
                logger.error(f"Error processing request: {str(e)}")
                error_response = handler._create_error_response(
                    None, 500, f"Server error: {str(e)}"
                )
                await socket.send_json(error_response)

    except KeyboardInterrupt:
        logger.info("Server shutting down...")
    finally:
        socket.close()
        context.term()
