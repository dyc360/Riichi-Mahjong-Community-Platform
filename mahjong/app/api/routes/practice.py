from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.core.mahjong_ai import mahjong_ai
from app.api.dependencies import get_current_user
from app.models.user import UserInDB

router = APIRouter()

@router.post("/calculate-tiles")
async def calculate_tiles(
    data: Dict[str, Any],
    current_user: UserInDB = Depends(get_current_user)
):
    hand_tiles = data.get("hand_tiles")
    if not hand_tiles or len(hand_tiles) != 13:
        raise HTTPException(status_code=400, detail="请输入13张手牌")
    
    try:
        result = mahjong_ai.calculate_waiting_tiles(hand_tiles)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="计算失败")

@router.post("/efficiency-practice")
async def efficiency_practice(
    data: Dict[str, Any],
    current_user: UserInDB = Depends(get_current_user)
):
    hand_tiles = data.get("hand_tiles")
    drawn_tile = data.get("drawn_tile")
    discarded_tile = data.get("discarded_tile")
    
    if not all([hand_tiles, drawn_tile, discarded_tile]):
        raise HTTPException(status_code=400, detail="缺少必要参数")
    
    try:
        analysis = mahjong_ai.analyze_efficiency(hand_tiles, drawn_tile)
        is_correct = analysis["best_discard"] == discarded_tile
        
        # 更新用户练习数据
        if current_user:
            await user_service.update_user_stats(str(current_user.id), is_correct)
        
        return {
            "success": True,
            "data": analysis,
            "is_correct": is_correct,
            "user_choice": discarded_tile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="分析失败")

@router.get("/check-ready")
async def check_ready_hand(hand_tiles: str):
    try:
        result = mahjong_ai.check_ready_hand(hand_tiles)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="检查失败")