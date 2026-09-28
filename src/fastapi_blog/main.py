from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

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
        "content": "Asynchronous programming can help applications handle many I/O operations efficiently.",
        "published": True,
    },
]

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def home():
    return f"<h1>{posts[0]["title"]}</h1>"

@app.get("/api/posts")
def get_posts():
    return posts