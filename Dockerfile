FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY audio-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY audio-service/ .

ENV PYTHONUNBUFFERED=1
ENV DEFAULT_ENGINE=librosa

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
