from quart import Response
import asyncio
import time


def register_sse_routes(app):
    @app.route("/health", methods=["GET"])
    async def health_check():
        """Endpoint SSE pour le health check."""

        async def stream():
            while True:
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                yield f'data: {{"status": "OK", "timestamp": "{timestamp}"}}\n\n'
                await asyncio.sleep(10)

        response = Response(stream(), mimetype="text/event-stream")
        response.headers["Cache-Control"] = "no-cache"
        response.headers["X-Accel-Buffering"] = "no"
        response.headers["Access-Control-Allow-Origin"] = "*"  # Important pour CORS
        response.headers["Connection"] = "keep-alive"  # Important pour SSE
        return response
