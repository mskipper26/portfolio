# api/Dockerfile — the comment API container.
FROM node:20-alpine

WORKDIR /app

# Install production deps first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js ./

ENV API_PORT=8138 API_HOST=0.0.0.0
EXPOSE 8138

CMD ["node", "server.js"]