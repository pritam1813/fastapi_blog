from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI()

app.mount(
    "/static", StaticFiles(directory="src/fastapi_blog/static_finished"), name="static"
)

template = Jinja2Templates(directory="src/fastapi_blog/templates")

posts: list[dict] = [
    {
        "id": 1,
        "title": "Getting Started with FastAPI",
        "author": "John Doe",
        "content": (
            "FastAPI is a modern, high-performance web framework for building APIs with Python based on standard Python type hints.\n\n"
            "Key advantages include automatic interactive API documentation via Swagger UI and ReDoc, out-of-the-box validation with Pydantic, and exceptional performance on par with NodeJS and Go thanks to Starlette and ASGI.\n\n"
            "To get started, simply install FastAPI with standard dependencies and launch your application using 'fastapi dev'. You will have a production-ready async web service up and running in minutes."
        ),
        "published": True,
    },
    {
        "id": 2,
        "title": "Understanding Python Type Hints",
        "author": "Jane Smith",
        "content": (
            "Type hints were introduced to Python to make code easier to reason about, maintain, and validate across large engineering teams.\n\n"
            "Beyond improving editor autocompletion and static analysis with tools like Mypy and Pyright, FastAPI leverages type hints at runtime. It automatically converts incoming request parameters, validates data types, and generates comprehensive OpenAPI schemas without requiring duplicate code.\n\n"
            "Embracing modern type syntax like 'int | None' and parameterized collections makes your codebase self-documenting and resilient against common bugs."
        ),
        "published": True,
    },
    {
        "id": 3,
        "title": "Building REST APIs with Python",
        "author": "Alex Johnson",
        "content": (
            "REST APIs allow distributed clients and frontends to interact with backend services predictably using standard HTTP protocols and semantics.\n\n"
            "When architecting RESTful services, using the right HTTP verbs—GET for retrieval, POST for creation, PUT/PATCH for updates, and DELETE for removal—along with standard HTTP status codes ensures seamless interoperability.\n\n"
            "Organizing your application into cohesive APIRouters keeps route definitions decoupled, maintainable, and modular as your platform scales."
        ),
        "published": True,
    },
    {
        "id": 4,
        "title": "Introduction to Pydantic",
        "author": "Sarah Wilson",
        "content": (
            "Pydantic provides data validation and settings management using Python type annotations.\n\n"
            "By declaring schemas that inherit from BaseModel, you guarantee that incoming data strictly adheres to defined contracts. If parsing fails, Pydantic produces informative, human-readable error messages detailing exactly which fields were invalid.\n\n"
            "FastAPI deeply integrates with Pydantic V2, offering blazingly fast validation implemented in Rust alongside seamless serialization via model_dump."
        ),
        "published": False,
    },
    {
        "id": 5,
        "title": "Async Programming in Python",
        "author": "Michael Brown",
        "content": (
            "Asynchronous programming enables web servers to handle thousands of concurrent I/O-bound requests using a single-threaded cooperative event loop.\n\n"
            "By utilizing 'async def' endpoints with 'await' for network requests, database transactions, and file transfers, the server yields execution during waiting periods rather than blocking the worker.\n\n"
            "Understanding when to use async operations versus standard thread pools is fundamental to architecting responsive and scalable backend systems."
        ),
        "published": True,
    },
]


@app.get("/", include_in_schema=False)
def home(request: Request):
    return template.TemplateResponse(
        request, "home.html", {"posts": posts, "title": "Home"}
    )


@app.get("/posts/{post_id}", include_in_schema=False)
def post_page(request: Request, post_id: int):
    for post in posts:
        if post.get("id") == post_id:
            title = post["title"][:50]
            return template.TemplateResponse(
                request, "post.html", {"post": post, "title": title}
            )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post Not Found")


@app.get("/api/posts")
def get_posts():
    return posts


@app.get("/api/posts/{post_id}")
def get_post(post_id: int):
    for post in posts:
        if post.get("id") == post_id:
            return post
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post Not Found")


@app.exception_handler(StarletteHTTPException)
def general_http_exception_handler(request: Request, exception: StarletteHTTPException):
    message = exception.detail if exception.detail else "An error occurred"

    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=exception.status_code, content={"detail": message}
        )

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
def validation_exception_handler(request: Request, exception: RequestValidationError):
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={"detail": exception.errors()},
        )

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
