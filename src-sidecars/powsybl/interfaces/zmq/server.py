import json
import logging
import zmq
import zmq.asyncio
import asyncio
import signal
import sys
import threading
from ..zmq.handler import ZmqHandler


async def zmq_server(network_service, bind_address="tcp://*:5555"):
    """Run the ZMQ server with proper shutdown handling.

    Args:
        network_service: The network service instance
        bind_address: ZMQ socket binding address
    """
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger("powsybl")

    # Initialize the ZMQ context
    context = zmq.asyncio.Context()

    # Create a REP socket (for request-reply pattern)
    socket = context.socket(zmq.REP)

    # Enable immediate address reuse
    socket.setsockopt(zmq.LINGER, 0)  # Close socket immediately on shutdown
    socket.setsockopt(zmq.IMMEDIATE, 1)  # Don't queue messages if no peers

    try:
        socket.bind(bind_address)
    except zmq.error.ZMQError as e:
        if e.errno == zmq.EADDRINUSE:
            logger.error(
                f"Address {bind_address} is already in use. Please check if another instance is running."
            )
            # Try to unbind and rebind
            try:
                socket.unbind(bind_address)
                socket.bind(bind_address)
                logger.info(f"Successfully rebound to {bind_address}")
            except:
                logger.error("Failed to rebind. Exiting...")
                socket.close()
                context.term()
                return
        else:
            logger.error(f"ZMQ Error: {e}")
            socket.close()
            context.term()
            return

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

    # Flag to control main loop
    running = True

    # Signal handler for graceful shutdown
    def signal_handler(signum, frame):
        nonlocal running
        running = False
        logger.info("Received shutdown signal, closing server...")

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Main server loop
    try:
        while running:
            # Check if there's a message waiting
            if await socket.poll(timeout=100, flags=zmq.POLLIN):
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

            # Small sleep to prevent CPU spinning
            await asyncio.sleep(0.01)

    except Exception as e:
        logger.error(f"Unexpected error in server loop: {str(e)}")

    finally:
        logger.info("Closing ZMQ server...")
        try:
            socket.unbind(bind_address)
        except:
            pass
        socket.close()
        context.term()
        logger.info("ZMQ server shut down successfully")


# Handle the stdin event loop. This can be used like a CLI.
def stdin_loop(network_service):
    """Handle commands from stdin for graceful shutdown."""
    print("[sidecar] Waiting for commands...", flush=True)
    
    loop = asyncio.new_event_loop()
    
    while True:
        # Read input from stdin.
        user_input = sys.stdin.readline().strip()
        
        # Check if the input matches one of the available functions
        match user_input:
            case "sidecar shutdown":
                print("[sidecar] Received 'sidecar shutdown' command.", flush=True)
                # Gracefully shutdown the ZMQ server
                shutdown_server(loop)
                break
            case _:
                print(
                    f"[sidecar] Invalid command [{user_input}]. Try again.", flush=True
                )
    
    loop.close()


def shutdown_server(loop):
    """Shutdown the server gracefully."""
    # Send shutdown signal to all asyncio tasks
    for task in asyncio.all_tasks(loop):
        task.cancel()
    
    # Stop the event loop
    loop.stop()
    
    # Set a flag that the server should shut down
    global running
    running = False
    
    print("[sidecar] Shutdown command executed. Server is shutting down...", flush=True)
    sys.exit(0)


def start_stdin_thread(network_service):
    """Start a thread to handle stdin commands."""
    try: 
        thread = threading.Thread(target=stdin_loop, args=(network_service,), daemon=True)
        thread.start()
    except:
        print("[sidecar] Failed to start input handler.", flush=True)


# Alternative function to check if port is in use before starting
async def check_port_in_use(address="tcp://localhost:4267"):
    """Check if the port is already in use."""
    context = zmq.Context()
    socket = context.socket(zmq.REP)
    try:
        socket.bind(address)
        # If we can bind, the port is free
        socket.unbind(address)
        socket.close()
        return False
    except zmq.error.ZMQError:
        # Port is already in use
        socket.close()
        return True
    finally:
        context.term()


# Function to force close existing ZMQ on port (Linux/Unix only)
def force_close_port(port):
    """Force close a port using system commands (Linux/Unix only)."""
    import os
    import platform

    if platform.system() == "Linux" or platform.system() == "Darwin":
        # Find the process using the port
        cmd = f"lsof -ti tcp:{port}"
        try:
            pids = os.popen(cmd).read().strip().split("\n")
            for pid in pids:
                if pid:
                    os.system(f"kill -9 {pid}")
            return True
        except:
            return False
    return False