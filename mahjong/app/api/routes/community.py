from fastapi import APIRouter

router = APIRouter()

@router.get("/posts")
async def get_posts():
    return {"message": "社区帖子列表"}

@router.post("/posts")
async def create_post():
    return {"message": "创建帖子"}