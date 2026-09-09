FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 make g++ && npm install --omit=dev && rm -rf /var/lib/apt/lists/*
COPY . .
EXPOSE 3002
CMD ["node", "src/index.js"]
