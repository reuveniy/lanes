FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/types ./src/types
COPY src/state ./src/state
COPY src/engine ./src/engine

EXPOSE 80 443 3001
ENV PORT=3001
ENV HTTP_PORT=80
ENV NODE_ENV=production

VOLUME /app/data
VOLUME /app/certs

RUN chown -R node:node /app
USER node

CMD ["npx", "tsx", "server/index.ts"]
