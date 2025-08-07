from functools import lru_cache
from http.client import HTTPException
from typing import Optional

from fastapi import Depends

from app.internal.config.config_fsm import ConfigFSM
from app.internal.repository import RepositoryManager


@lru_cache
def create_config() -> ConfigFSM:
    return ConfigFSM()

@lru_cache
def create_repository_manager() -> RepositoryManager:
    return RepositoryManager()

async def get_config() -> ConfigFSM:
    return create_config()

async def get_repository_manager() -> RepositoryManager:
    return create_repository_manager()

async def get_repository(
    config_fsm: ConfigFSM = Depends(get_config)
) -> RepositoryManager:
    return await create_repository_manager().ensure_repository(config_fsm)

async def get_repository_optional(
    config_fsm: ConfigFSM = Depends(get_config)
) -> Optional[RepositoryManager]:
    """Dépendance optionnelle qui ne lève pas d'exception."""
    try:
        return await create_repository_manager().ensure_repository(config_fsm)
    except HTTPException:
        return None