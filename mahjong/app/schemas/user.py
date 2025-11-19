from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: Optional[str] = None
    username: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None