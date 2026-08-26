from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str


class CategoryResponse(BaseModel):
    category_id: int
    user_id: int
    name: str

    class Config:
        from_attributes = True