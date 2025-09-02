# Dockerfile

# --- Build Stage ---
FROM python:3.11-slim as builder

WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy only dependency definition files
COPY poetry.lock pyproject.toml /app/

# Install dependencies
# --no-root: Don't install the project itself, only dependencies
# --no-dev: Don't install development dependencies
RUN poetry install --no-root --no-dev

# --- Final Stage ---
FROM python:3.11-slim

WORKDIR /app

# Copy virtual environment from builder stage
COPY --from=builder /app/.venv /.venv

# Activate virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY ./app /app/app

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
