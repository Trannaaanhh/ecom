FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (needed for psycopg2 and potentially confluent-kafka/grpc)
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && apt-get clean

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir $(grep -v '^torch' /app/requirements.txt)

# Install CPU-only torch (~150MB instead of ~2GB with CUDA)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY . /app

# Run Gunicorn in production mode
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "ai_service.wsgi:application"]
