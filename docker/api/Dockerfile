FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm ci --production 2>/dev/null || npm install --production

COPY server/server.js server/db.js ./

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
