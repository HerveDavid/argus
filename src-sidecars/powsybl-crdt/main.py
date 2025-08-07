import threading
import logging
import sys

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


def configure_advanced_logging():
    formatter = logging.Formatter(
        fmt='[%(asctime)s] %(name)s:%(lineno)d - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    from logging.handlers import RotatingFileHandler
    file_handler = RotatingFileHandler(
        'powsybl.log',
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)

    return logging.getLogger(__name__)