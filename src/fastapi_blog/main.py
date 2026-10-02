from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="src/fastapi_blog/static_finished"), name="static")

template = Jinja2Templates(directory="src/fastapi_blog/templates")

posts: list[dict] = [
    {
        "id": 1,
        "title": "Getting Started with FastAPI",
        "author": "John Doe",
        "content": "FastAPI is a modern Python framework for building APIs quickly and efficiently.",
        "published": True,
    },
    {
        "id": 2,
        "title": "Understanding Python Type Hints",
        "author": "Jane Smith",
        "content": "Type hints make Python code easier to understand, maintain, and validate.",
        "published": True,
    },
    {
        "id": 3,
        "title": "Building REST APIs with Python",
        "author": "Alex Johnson",
        "content": "REST APIs allow different applications to communicate using standard HTTP methods.",
        "published": True,
    },
    {
        "id": 4,
        "title": "Introduction to Pydantic",
        "author": "Sarah Wilson",
        "content": "Pydantic provides powerful data validation using Python type annotations.",
        "published": False,
    },
    {
        "id": 5,
        "title": "Async Programming in Python",
        "author": "Michael Brown",
        "content": ("Asynchronous programming can help applications handle many I/O operations efficiently."),
        "published": True,
    },
]


@app.get("/", include_in_schema=False)
def home(request: Request):
    return template.TemplateResponse(request, "home.html", {"posts": posts, "title": "Home"})


@app.get("/api/posts")
def get_posts():
    return posts
