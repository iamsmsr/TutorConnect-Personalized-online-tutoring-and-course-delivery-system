#sudo docker run -d -p 10000:10000 tutorconnect-frontend # Use official Python image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Copy project files
COPY . .

# Install Poetry
RUN pip install poetry

# Install dependencies
RUN poetry install --no-interaction --no-ansi

# Install additional packages using Poetry
RUN poetry add fastapi uvicorn motor python-multipart pymongo

# Download NLTK data
RUN poetry run python -c "import nltk; nltk.download('punkt')"

# Run the load-docs command to process PDFs
#RUN poetry run load-docs

# Expose port
EXPOSE 10000

# Start FastAPI app
CMD ["poetry", "run", "uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", "10000"]