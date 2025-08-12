FROM python:3.13-slim AS builder
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*
COPY requirements/dev.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

FROM python:3.13-slim
RUN useradd -m -r appuser && mkdir /app && chown -R appuser /app
WORKDIR /app
COPY --from=builder /usr/local /usr/local
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
RUN chmod +x /app/entrypoint.prod.sh
CMD ["/app/entrypoint.prod.sh"]
