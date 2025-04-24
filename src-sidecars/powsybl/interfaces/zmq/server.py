import json
import logging
import zmq
import zmq.asyncio
import sys
import os
from ..zmq.handler import ZmqHandler

# Force flush immediately
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Custom handler that forces flush
class FlushingStreamHandler(logging.StreamHandler):
    def emit(self, record):
        super().emit(record)
        self.flush()

async def zmq_server(network_service, bind_address="tcp://*:5555"):
    """Run the ZMQ server.
    Args:
        network_service: The network service instance
        bind_address: ZMQ socket binding address
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Add new handlers with immediate flushing
    stdout_handler = FlushingStreamHandler(sys.stdout)
    stdout_handler.setFormatter(logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    ))
    root_logger.addHandler(stdout_handler)

    # Configure logging
    logger = logging.getLogger("zmq_server")
    
    # Log startup information
    print("[ZMQ] Starting server...", flush=True)
    logger.info("=" * 50)
    logger.info("ZMQ Server Starting")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"ZMQ version: {zmq.__version__}")
    logger.info(f"Process ID: {os.getpid()}")
    logger.info(f"Working directory: {os.getcwd()}")
    logger.info("=" * 50)
    
    try:
        # Initialize the ZMQ context
        logger.info("Creating ZMQ context...")
        context = zmq.asyncio.Context()
        logger.info("ZMQ context created successfully")
        
        # Create a REP socket (for request-reply pattern)
        logger.info("Creating REP socket...")
        socket = context.socket(zmq.REP)
        logger.info("REP socket created successfully")
        
        # Attempt to bind to the address
        logger.info(f"Attempting to bind to {bind_address}...")
        socket.bind(bind_address)
        logger.info(f"Successfully bound to {bind_address}")
        
        # Create the handler
        logger.info("Creating ZmqHandler...")
        handler = ZmqHandler(network_service)
        logger.info("ZmqHandler created successfully")
        
        logger.info("=" * 50)
        logger.info(f"ZMQ server is now running and listening on {bind_address}")
        logger.info("=" * 50)
        
        # Flush stdout and stderr to ensure logs are visible
        sys.stdout.flush()
        sys.stderr.flush()
        
        # Try to load the last network
        logger.info("Attempting to load last network...")
        result = await network_service.load_last_network()
        if result:
            logger.warning(f"Could not load previous network: {result}")
        else:
            logger.info("Previous network loaded successfully")
            
        # Clean up old network files
        logger.info("Cleaning up old network files...")
        await network_service.cleanup_old_networks(max_files=5)
        logger.info("Network cleanup completed")
        
        # Main server loop
        logger.info("Entering main server loop...")
        message_count = 0
        
        try:
            while True:
                logger.debug(f"Waiting for message #{message_count + 1}...")
                
                # Wait for next request from client
                message = await socket.recv()
                message_count += 1
                
                logger.info(f"Received message #{message_count}: {message[:100]}...")
                
                try:
                    # Parse JSON message
                    logger.debug("Parsing JSON message...")
                    request = json.loads(message)
                    logger.debug(f"Successfully parsed JSON: {list(request.keys()) if isinstance(request, dict) else type(request)}")
                    
                    # Process the message
                    logger.debug("Processing request...")
                    response = await handler.process_message(request)
                    logger.debug(f"Request processed successfully: {list(response.keys()) if isinstance(response, dict) else type(response)}")
                    
                    # Send reply back to client
                    logger.debug("Sending response...")
                    await socket.send_json(response)
                    logger.info(f"Response sent for message #{message_count}")
                    
                except json.JSONDecodeError as e:
                    # Handle invalid JSON
                    logger.error(f"Invalid JSON received: {str(e)}")
                    error_response = handler._create_error_response(
                        None, 400, f"Invalid JSON: {str(e)}"
                    )
                    await socket.send_json(error_response)
                    logger.warning(f"Error response sent for invalid JSON message #{message_count}")
                    
                except Exception as e:
                    # Handle any other errors
                    import traceback
                    logger.error(f"Error processing request: {str(e)}")
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    
                    error_response = handler._create_error_response(
                        None, 500, f"Server error: {str(e)}"
                    )
                    await socket.send_json(error_response)
                    logger.warning(f"Error response sent for message #{message_count}")
                    
        except KeyboardInterrupt:
            logger.info("Received KeyboardInterrupt signal")
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
        finally:
            logger.info("Server shutting down...")
            
    except Exception as e:
        logger.error(f"Failed to start ZMQ server: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise
        
    finally:
        logger.info("Cleaning up...")
        if 'socket' in locals():
            logger.info("Closing socket...")
            socket.close()
            logger.info("Socket closed")
            
        if 'context' in locals():
            logger.info("Terminating context...")
            context.term()
            logger.info("Context terminated")
            
        logger.info("Server shutdown complete")
        # Ensure all logs are flushed
        sys.stdout.flush()
        sys.stderr.flush()