# Build admin frontend
FROM node:20-alpine AS admin_ui_builder

# Build under node's home to avoid permission issues in some environments
USER node
WORKDIR /home/node/admin

COPY --chown=node:node admin-frontend/package.json admin-frontend/package-lock.json ./
RUN npm ci
COPY --chown=node:node admin-frontend/ ./
RUN npm run build



# Backend runtime
FROM node:20-alpine
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/src ./src


# Copy built admin UI into the image; served by src/admin.js
COPY --from=admin_ui_builder /home/node/admin/dist ./admin-dist


ENV PORT=8000
EXPOSE 8000

CMD ["node", "--watch", "src/index.js"]


