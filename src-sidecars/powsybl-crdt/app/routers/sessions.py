from fastapi import APIRouter, Form, HTTPException, UploadFile, File, Depends
from pathlib import Path
from typing import Optional

from ..dependencies import get_config
from app.internal.config import ConfigFSM, ConfigFSMError

from app.config.tags import Tags

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"],
    dependencies=[Depends(get_config)],
)


@router.post("/config")
async def create_session_config(
        name: str = Form(...),
        path: Optional[str] = Form(None),
        file: Optional[UploadFile] = File(None),
        base_directory: Optional[str] = Form(None),
        config: ConfigFSM = Depends(get_config)
):
    if not path and not file:
        raise HTTPException(
            status_code=400,
            detail="Either 'path' or 'file' must be provided"
        )

    if path and file:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'path' or 'file', not both"
        )

    try:
        config_source = None

        if path:
            config_path = Path(path)

            if not config_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Configuration file not found: {path}"
                )

            if not config_path.is_file():
                raise HTTPException(
                    status_code=400,
                    detail=f"Path is not a file: {path}"
                )

            if not config_path.suffix.lower() == '.toml':
                raise HTTPException(
                    status_code=400,
                    detail="File must be a TOML file (.toml)"
                )

            config_source = config_path

        elif file:
            if not file.filename:
                raise HTTPException(
                    status_code=400,
                    detail="Uploaded file must have a filename"
                )

            if not file.filename.endswith('.toml'):
                raise HTTPException(
                    status_code=400,
                    detail="File is not TOML (.toml)"
                )

            config_source = file

        base_dir = None
        if base_directory:
            base_dir = Path(base_directory)
            if not base_dir.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Base directory not found: {base_directory}"
                )
            if not base_dir.is_dir():
                raise HTTPException(
                    status_code=400,
                    detail=f"Base directory path is not a directory: {base_directory}"
                )

        if config.is_ready():
            await config.reload(name, config_source, base_dir)
        else:
            await config.load(name, config_source, base_dir)

        return config.get_status()

    except ConfigFSMError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/config/directory")
async def set_base_directory(
        directory: str = Form(...),
        config: ConfigFSM = Depends(get_config)
):
    if not config.is_ready():
        raise HTTPException(
            status_code=400,
            detail="No configuration loaded"
        )

    try:
        base_path = Path(directory)
        if not base_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Directory does not exist: {directory}"
            )

        if not base_path.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Path is not a directory: {directory}"
            )

        config.set_base_directory(base_path)

        return config.get_status()

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/config/status")
async def get_config_status(config: ConfigFSM = Depends(get_config)):
    return config.get_status()