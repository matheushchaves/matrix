FROM node:20-slim

WORKDIR /app

# Copy server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production

# Copy all files
COPY . .

EXPOSE 8080

CMD ["node", "server/server.js"]
