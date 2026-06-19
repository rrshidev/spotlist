import io
import os
import uuid
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")

    content = await file.read()

    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"

    if file.content_type == "image/webp":
        img = Image.open(io.BytesIO(content))
        img.load()
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")
        file_ext = "jpg"
        filename = f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        img.save(filepath, "JPEG", quality=85)
    else:
        filename = f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(content)

    return {"url": f"/api/v1/uploads/{filename}"}


@router.get("/{filename}")
async def get_file(filename: str):
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    if os.path.exists(filepath):
        return FileResponse(filepath)
    if filename.endswith(".webp"):
        jpg_path = os.path.join(settings.UPLOAD_DIR, filename[:-5] + ".jpg")
        if os.path.exists(jpg_path):
            return FileResponse(jpg_path)
    raise HTTPException(status_code=404, detail="File not found")