# ───────────────
# ETAPA 1: Build
# ───────────────
FROM python:3.11-slim as builder

WORKDIR /app

# Instalar dependencias de compilación si fueran necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


# ───────────────
# ETAPA 2: Runtime
# ───────────────
FROM python:3.11-slim

WORKDIR /app

# Solo instalamos curl para el healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar wheels desde la etapa de build
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copiar el resto del código
COPY . .

# Variables de entorno por defecto
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
