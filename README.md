# FastAPI Blog

A small blog application built with FastAPI, SQLAlchemy (async), Jinja2 templates
and SQLite.

## Requirements

- [uv](https://docs.astral.sh/uv/)
- Python 3.13+ (uv can install it for you)

## Setup

Install the project and its dependencies into the local `.venv`:

```bash
uv sync
```

Create a `.env` file in the project root (it is git-ignored) with a secret key
used for signing JWTs:

```dotenv
SECRET_KEY=replace-me-with-a-long-random-string
# optional, these are the defaults
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Generate a suitable key with:

```bash
uv run python -c "import secrets; print(secrets.token_hex(32))"
```

## Running the app

Run everything from the project root — the static file and template directories
are resolved relative to the current working directory.

### Development server (auto-reload)

```bash
uv run fastapi dev src/fastapi_blog/main.py
```

- App: <http://127.0.0.1:8000>
- Interactive API docs: <http://127.0.0.1:8000/docs>

The FastAPI CLI turns the file path into the import string
`fastapi_blog.main:app` and reloads the server when you save a file. To change
host/port:

```bash
uv run fastapi dev src/fastapi_blog/main.py --host 0.0.0.0 --port 8080
```

> Note: plain `uv run fastapi dev` without a path will not find the app, because
> `main.py` lives under `src/`. Always pass the path above, or use one of the
> alternatives below.

### Production-style server

```bash
uv run fastapi run src/fastapi_blog/main.py
```

### With uvicorn directly

Because `uv sync` installs the project in editable mode, the package is
importable and you can use the import string instead of a path:

```bash
uv run uvicorn fastapi_blog.main:app --reload
```

## Using the app

- Create an account at <http://127.0.0.1:8000/register> or sign in at `/login`.
- Login stores the JWT from `POST /api/users/token` in `localStorage` and sends
  it as a `Bearer` token on API requests. Logging out clears it.
- Signed-in users get the **New Post** button and a user menu (My posts,
  Account settings, Log out).
- Edit/delete buttons only appear on your own posts. Drafts are only listed for
  their author.
- Account settings live on a dedicated page (`/account`): update your username,
  email, or log out, and delete your account together with its posts.
  Password changes and avatar uploads are UI-only for now because the API does
  not expose endpoints for them yet.

## Database

The app uses SQLite at `./blog.db`. Tables are created automatically on startup,
so no migration step is needed. To reset the data, stop the server and delete
`blog.db`.

## Development commands

```bash
uv run ruff check .        # lint
uv run ruff format .       # format
uv add <package>           # add a dependency (updates pyproject.toml + uv.lock)
```
