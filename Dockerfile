FROM node:20-slim
WORKDIR /app
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server/server.js"]
