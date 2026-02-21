"""Logging configuration."""

import logging
import sys
from pathlib import Path

from pythonjsonlogger import jsonlogger

from src.utils.config import get_settings

settings = get_settings()


def setup_logger(name: str) -> logging.Logger:
    """
    Set up logger with JSON formatting.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # JSON formatter for production
    if settings.ENVIRONMENT == "production":
        formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    else:
        # Simple formatter for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler
    log_dir = Path(settings.LOGS_DIR)
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / f"{settings.APP_NAME.lower().replace(' ', '_')}.log"

    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
