from abc import ABC, abstractmethod

from src.shared.handler_type import Handlers


class BaseHandler(ABC):

    @abstractmethod
    def get_handlers(self) -> Handlers:
        pass