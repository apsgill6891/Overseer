FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OVERSEER_DEV_MODE=0

WORKDIR /app
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt
COPY . /app

RUN useradd --create-home --uid 10001 overseer \
    && chown -R overseer:overseer /app
USER overseer

EXPOSE 8080
CMD ["python", "server/overseer_server.py", "--host", "0.0.0.0", "--port", "8080"]
