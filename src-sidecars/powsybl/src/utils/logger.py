import logging
import sys
from typing import Optional
from pathlib import Path


class LoggerConfig:

    _configured = False
    _logger_instances = {}

    @classmethod
    def setup_logging(
            cls,
            level: str = "INFO",
            log_file: Optional[str] = None,
            format_string: Optional[str] = None
    ) -> None:

        if cls._configured:
            return  # Avoid reconfiguration

        if format_string is None:
            format_string = '%(asctime)s | %(name)-8s | %(levelname)-8s | %(message)s'

        root_logger = logging.getLogger()
        root_logger.setLevel(getattr(logging, level.upper()))

        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        formatter = logging.Formatter(format_string)

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)

            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)

        cls._configured = True

    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:

        if not cls._configured:
            cls.setup_logging()

        # Cache logger instances
        if name not in cls._logger_instances:
            cls._logger_instances[name] = logging.getLogger(name)

        return cls._logger_instances[name]


def get_logger(name: str) -> logging.Logger:
    return LoggerConfig.get_logger(name)
