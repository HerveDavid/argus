import threading
import logging

from app.main import stdin_loop, start_api_server, shutdown_event


def configure_logging():
    log_format = '%(levelname)s: %(name)s - %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'

    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        datefmt=date_format,
    )

    logger = logging.getLogger(__name__)
    return logger


def start_input_thread():
    logger = logging.getLogger(__name__)
    try:
        input_thread = threading.Thread(target=stdin_loop, name="stdin_thread")
        input_thread.daemon = True
        input_thread.start()
        logger.info("Input thread started successfully")
        return input_thread
    except Exception as e:
        logger.error(f"Failed to start input handler: {e}")
        return None


if __name__ == "__main__":
    logger = configure_logging()

    logger.info("=== Starting PowSyBl Application ===")

    try:
        input_thread = start_input_thread()
        if input_thread:
            logger.info("Input thread started successfully")
        else:
            logger.warning("Input thread could not be started")

        logger.info("Starting API server...")
        start_api_server()

    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
    except Exception as e:
        logger.error(f"Error during startup: {e}", exc_info=True)
    finally:
        logger.info("Shutting down...")
        shutdown_event.set()
        logger.info("=== Application terminated ===")
