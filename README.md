# Resume

A secure, resource-oriented backend system for tailoring resumes, structuring formatting drafts via Google Gemini, and rendering ATS-compliant PDF documents.

---

## Key Capabilities

* **RESTful API**: Strictly resource-oriented design with logical sub-resource paths.
* **Client-Side Cryptography**: Zero-knowledge setup where users upload client-encrypted custom Google API keys using the server's JWKS public key.
* **Dual-Mode LLM Engine**: Runs locally in development using Ollama (`gemma4:e2b`) and scales to Google Gemini (`gemini-3.6-flash`) in production.
* **PDF Compiler**: Utilizes ReportLab to generate clean, professional ATS-parseable PDF resumes.

---

## Environment Variables (`.env`)

Configure the following variables in the root `.env` file:

```env
DATABASE_URL=
SESSION_SECRET_KEY=
ENVIRONMENT=development
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RSA_PRIVATE_KEY=
RSA_PUBLIC_KEY=
```

* `DATABASE_URL`: Asynchronous PostgreSQL connection URI (`postgresql+asyncpg://...`).
* `SESSION_SECRET_KEY`: Cryptographically secure secret key for session signatures.
* `ENVIRONMENT`: Deployment mode (`development` or `production`).
* `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Credentials to support Google OAuth 2.0.
* `RSA_PRIVATE_KEY` / `RSA_PUBLIC_KEY`: PEM-formatted RSA key pair used to decrypt user API keys. If running in production mode, the server will fail to start if these keys are missing.

---

## Technical Stack & Dependencies

### Backend Packages

| Package | Version | Purpose | Reference |
| :--- | :--- | :--- | :--- |
| `fastapi` | `>=0.141.1` | Web framework, REST routing, and static file hosting | [FastAPI Docs](https://fastapi.tiangolo.com/) |
| `authlib` | `>=1.7.2` | OAuth 2.0 flow and token verification | [Authlib Docs](https://docs.authlib.org/) |
| `itsdangerous` | `>=2.2.0` | Signed HTTP-only session cookies | [itsdangerous Docs](https://itsdangerous.palletsprojects.com/) |
| `langchain` | `>=1.3.14` | Core LLM orchestration and prompt templates | [LangChain Docs](https://python.langchain.com/) |
| `langchain-google-genai` | `>=4.3.2` | Gemini production integration (`gemini-3.6-flash`) | [LangChain Google Docs](https://python.langchain.com/docs/integrations/chat/google_generative_ai/) |
| `langchain-ollama` | `>=1.1.0` | Ollama development integration (`gemma4:e2b`) | [LangChain Ollama Docs](https://python.langchain.com/docs/integrations/chat/ollama/) |
| `sqlalchemy` | `>=2.0.51` | Asynchronous ORM and query builder | [SQLAlchemy Docs](https://docs.sqlalchemy.org/) |
| `asyncpg` | `>=0.31.0` | Asynchronous PostgreSQL database driver | [asyncpg Repository](https://github.com/MagicStack/asyncpg) |
| `alembic` | `>=1.19.1` | Database migration management | [Alembic Docs](https://alembic.sqlalchemy.org/) |
| `reportlab` | `>=5.0.0` | PDF rendering engine for ATS resumes | [ReportLab Docs](https://docs.reportlab.com/) |

### CLI Configuration

Configured in [`pyproject.toml`](./pyproject.toml):

```toml
[tool.fastapi]
entrypoint = "server.main:app"
```

---

## Getting Started

### 1. Start the Database
From the root directory:
```bash
docker compose up -d
```

### 2. Start the Backend Server
From the root directory:
```bash
uv run fastapi dev --port 8000
```

### 3. Start the Frontend Client
From the `server/client` directory:
```bash
bun run dev
```

### 4. Interactive Docs
* **Swagger OpenAPI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
