from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_admin_user
from app.models.user import UserInDB

router = APIRouter()

@router.get("/users")
async def get_all_users(current_user: UserInDB = Depends(get_current_admin_user)):
    return {"message": "管理员获取用户列表"}