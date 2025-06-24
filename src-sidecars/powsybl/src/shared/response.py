from typing import Dict, Any, Union


class Response:

    def __init__(self, id: str, status: int, result: Dict[str, Any]):
        self.type = "response"
        self.id = id
        self.status = status
        self.result = result

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "id": self.id,
            "status": self.status,
            "result": self.result,
        }

class ResponseBuilder:
    def __init__(self):
        self._id = None
        self._status = None
        self._result = {}

    def with_id(self, id: str) -> 'ResponseBuilder':
        self._id = id
        return self

    def with_status(self, status: int) -> 'ResponseBuilder':
        self._status = status
        return self

    def with_error(self, error: Union[str, Dict[str, Any]]) -> 'ResponseBuilder':
        if isinstance(error, str):
            self._result = {"error": error}
        else:
            self._result = {"error": error}
        return self

    def with_result(self, result: Dict[str, Any]) -> 'ResponseBuilder':
        self._result = result
        return self

    def build(self) -> Response:
        if not self._id:
            raise ValueError("ID is required")
        if not self._status:
            raise ValueError("Status is required")
        return Response(self._id, self._status, self._result)