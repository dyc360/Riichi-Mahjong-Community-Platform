from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.models.user import UserInDB

router = APIRouter()

@router.get("/me")
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@router.put("/me")
async def update_user_info():
    return {"message": "更新用户信息"}