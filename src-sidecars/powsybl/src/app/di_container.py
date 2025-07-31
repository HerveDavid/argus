from typing import TypeVar, Type, Dict, Any, Callable

T = TypeVar("T")


class DIContainer:
    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._singletons: Dict[str, Any] = {}

    def register_singleton(self, interface: Type[T], implementation: T) -> None:
        key = interface.__name__
        self._singletons[key] = implementation

    def register_factory(self, interface: Type[T], factory: Callable[[], T]) -> None:
        key = interface.__name__
        self._factories[key] = factory

    def register_instance(self, interface: Type[T], instance: T) -> None:
        key = interface.__name__
        self._services[key] = instance

    def get(self, interface: Type[T]) -> T:
        key = interface.__name__

        if key in self._singletons:
            return self._singletons[key]

        if key in self._services:
            return self._services[key]

        if key in self._factories:
            return self._factories[key]()

        raise ValueError(f"Service {key} not registered")

    def clear(self) -> None:
        self._services.clear()
        self._factories.clear()
        self._singletons.clear()


container = DIContainer()
