FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 make g++ && (npm ci --omit=dev 2>/dev/null || npm install --omit=dev) && rm -rf /var/lib/apt/lists/*
COPY . .
CMD ["node", "src/index.js"]
