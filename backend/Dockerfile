FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ENV PORT=8000
EXPOSE 8000

CMD ["node", "--watch", "src/index.js"]

