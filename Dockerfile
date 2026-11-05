FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --omit=dev

COPY backend/server.js ./

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
