# Use official Python image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Copy project files
COPY . .

# Install Poetry
RUN pip install poetry

# Install dependencies
RUN poetry install --no-interaction --no-ansi

# Expose port
EXPOSE 10000

# Start FastAPI app
CMD ["poetry", "run", "uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", "10000"]