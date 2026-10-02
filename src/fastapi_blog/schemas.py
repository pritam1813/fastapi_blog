from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(min_length=1, max_length=120)


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    # Fields that are added by sytem and not provided by user or client
    id: int
    image_file: str | None
    image_path: str


class PostBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=20)
    published: bool = False


class PostCreate(PostBase):
    user_id: int  # Temporary


class PostResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)

    # Fields that are added by sytem and not provided by user or client
    id: int
    user_id: int
    date_posted: datetime
    author: UserResponse
