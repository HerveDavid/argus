from typing import Dict, Any, Callable, Tuple, Awaitable

HandlerReturnType = Tuple[int, Dict[str, Any]]
HandlerType = Callable[..., Awaitable[HandlerReturnType]]
Handlers = Dict[str,HandlerType]
