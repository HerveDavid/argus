import uuid
from typing import Dict, Any, Optional


class Request:

    def __init__(self, method: str, params: Optional[Dict[str, Any]] = None, id: Optional[str] = None):
        self.type = "request"
        self.id = id or str(uuid.uuid4())
        self.method = method
        self.params = params or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "method": self.method,
            "params": self.params,
        }

class RequestBuilder:
    def __init__(self):
        self._method = None
        self._params = {}
        self._id = None

    def with_method(self, method: str) -> 'RequestBuilder':
        self._method = method
        return self

    def with_params(self, params: Dict[str, Any]) -> 'RequestBuilder':
        self._params = params
        return self

    def with_id(self, id: str) -> 'RequestBuilder':
        self._id = id
        return self

    def build(self) -> Request:
        if not self._method:
            raise ValueError("Method is required")
        return Request(self._method, self._params, self._id)