# Stage 1: Build the React/Vite frontend
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install dependencies into a temp directory to cache them across builds
FROM base AS client-install
RUN mkdir -p /temp/dev
COPY server/client/package.json server/client/bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy node_modules and project files, then build the production bundle
FROM base AS client-build
COPY --from=client-install /temp/dev/node_modules node_modules
COPY server/client ./
ENV NODE_ENV=production
RUN bun run build

# Stage 2: Build the FastAPI backend and bundle the frontend
FROM python:3.14-slim AS backend

COPY --from=ghcr.io/astral-sh/uv:0.12.4 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install dependencies in their own layer so source changes don't invalidate it
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project

COPY server ./server
COPY --from=client-build /usr/src/app/dist ./server/client/dist

EXPOSE 8000

CMD ["sh", "-c", "uv run fastapi run --port ${PORT:-8000}"]
