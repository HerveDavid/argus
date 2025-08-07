import asyncio
import logging
import os
import signal
import sys
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import Config, Server

from .routers import sessions, powsybl, update

PORT_API = 46728
server_instance = None
shutdown_event = threading.Event()
server_task = None

logger = logging.getLogger(__name__)


def signal_handler(signum, frame):
    logger.info(f"[powsybl] Received {signum} signal, stopping server...")
    shutdown_event.set()
    if server_instance:
        server_instance.should_exit = True
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    logger.info("[powsybl] Started server")
    yield

    # Shutdown
    logger.info("[powsybl] Stopping server...")
    shutdown_event.set()


app = FastAPI(
    title="powsybl-crdt",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS settings
origins = [
    "*",  # to whitelist any url, REMOVE THIS FOR PRODUCTION!!!
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(powsybl.router)
app.include_router(update.router)


@app.get("/connect")
def connect_to_api_server():
    logger.info("[server] Connecting to server...")
    host = f"http://localhost:{PORT_API}"
    return {
        "message": f"Connected to api server on port {PORT_API}. Refer to '{host}/docs' for api docs.",
        "data": {
            "port": PORT_API,
            "pid": os.getpid(),
            "host": host,
        },
    }


@app.get("/shutdown")
async def shutdown_server():
    logger.info("[powsybl] Arrêt demandé via API")
    shutdown_event.set()
    if server_instance:
        server_instance.should_exit = True
    return {"message": "Shutdown initiated"}


def kill_process():
    logger.info("[powsybl] Kill process")
    shutdown_event.set()
    if server_instance:
        server_instance.should_exit = True
    os._exit(0)


async def start_api_server_async(**kwargs):
    global server_instance, server_task
    port = kwargs.get("port", PORT_API)

    try:
        if server_instance is None:
            logger.info("[powsybl] Starting API server...")
            config = Config(
                app,
                host="0.0.0.0",
                port=port,
                log_level="info",
                access_log=False
            )
            server_instance = Server(config)

            async def shutdown_monitor():
                while not shutdown_event.is_set():
                    await asyncio.sleep(0.1)
                logger.info("[powsybl] Stopping server...")
                if server_instance:
                    server_instance.should_exit = True
                    await asyncio.sleep(0.5)

            monitor_task = asyncio.create_task(shutdown_monitor())

            try:
                await server_instance.serve()
            finally:
                monitor_task.cancel()
                logger.info("[powsybl] Server stopped")
        else:
            logger.info("[powsybl] Server instance already running.")
    except Exception as e:
        logger.error(f"[powsybl] Error starting API server: {e}")
        raise


def start_api_server(**kwargs):
    global server_task
    try:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(start_api_server_async(**kwargs))
    except KeyboardInterrupt:
        logger.info("[powsybl] Interrupted by user")
    except Exception as e:
        logger.error(f"[powsybl] Error: {e}")
    finally:
        logger.info("[powsybl] Server stopped")
        shutdown_event.set()


def stdin_loop():
    logger.info("[powsybl] Waiting for commands...")
    try:
        while not shutdown_event.is_set():
            try:
                ready, _, _ = select.select([sys.stdin], [], [], 1.0)  # timeout de 1 seconde
                if ready:
                    user_input = sys.stdin.readline().strip()
                    if not user_input:  # EOF
                        logger.info("[powsybl] EOF reçu, arrêt du sidecar")
                        break

                    match user_input:
                        case "sidecar shutdown":
                            logger.info(f"[powsybl] Received '{user_input}' command.")
                            shutdown_event.set()
                            kill_process()
                            break
                        case _:
                            logger.debug(f"[powsybl] Command received: [{user_input}]")
                else:
                    continue
            except EOFError:
                logger.info("[powsybl] EOF reçu, arrêt du sidecar")
                break
            except Exception as e:
                logger.error(f"[powsybl] Erreur dans stdin_loop: {e}")
                break
    except Exception as e:
        logger.error(f"[powsybl] Erreur fatale dans stdin_loop: {e}")
    finally:
        logger.info("[powsybl] stdin_loop terminé")
        shutdown_event.set()



import select