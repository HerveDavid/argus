from logging.config import dictConfig

dictConfig(
    {
        "version": 1,
        "loggers": {
            "quart.app": {
                "level": "ERROR",
            },
        },
    }
)
