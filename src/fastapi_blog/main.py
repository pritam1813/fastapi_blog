from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.exceptions import HTTPException as StarletteHTTPException

import fastapi_blog.models as models
from fastapi_blog.database import Base, engine, get_db
from fastapi_blog.routers import posts, users


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(lifespan=lifespan)

app.mount(
    "/static", StaticFiles(directory="src/fastapi_blog/static_finished"), name="static"
)

app.mount("/media", StaticFiles(directory="src/fastapi_blog/media"), name="media")

template = Jinja2Templates(directory="src/fastapi_blog/templates")

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])


# Pages
@app.get("/", include_in_schema=False)
async def home(request: Request, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(models.Post).options(selectinload(models.Post.author))
    )
    posts = result.scalars().all()
    return template.TemplateResponse(
        request, "home.html", {"posts": posts, "title": "Home"}
    )


@app.get("/posts/{post_id}", include_in_schema=False)
async def post_page(
    request: Request, post_id: int, db: Annotated[AsyncSession, Depends(get_db)]
):
    result = await db.execute(
        select(models.Post)
        .options(selectinload(models.Post.author))
        .where(models.Post.id == post_id)
    )
    post = result.scalars().first()

    if post:
        return template.TemplateResponse(
            request, "post.html", {"post": post, "title": post.title}
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post Not Found")


@app.get("/users/{user_id}/posts", include_in_schema=False, name="user_posts")
async def user_post_page(
    request: Request, user_id: int, db: Annotated[AsyncSession, Depends(get_db)]
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))

    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    result = await db.execute(
        select(models.Post)
        .options(selectinload(models.Post.author))
        .where(models.Post.user_id == user_id)
    )
    posts = result.scalars().all()

    return template.TemplateResponse(
        request,
        "user_posts.html",
        {"post": posts, "user": user, "title": f"{user.username}'s posts"},
    )


# APIs


@app.exception_handler(StarletteHTTPException)
async def general_http_exception_handler(
    request: Request, exception: StarletteHTTPException
):
    if request.url.path.startswith("/api"):
        return await http_exception_handler(request, exception)

    message = exception.detail if exception.detail else "An error occurred"

    return template.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": exception.status_code,
            "title": exception.status_code,
            "message": message,
        },
        status_code=exception.status_code,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exception: RequestValidationError
):
    if request.url.path.startswith("/api"):
        return await request_validation_exception_handler(request, exception)

    return template.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "title": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "message": "Invalid Request",
        },
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    )
