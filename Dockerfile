FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache cairo pango libjpeg-turbo giflib pixman font-dejavu

WORKDIR /app
COPY package.json package-lock.json ./
RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev \
    && npm ci --omit=dev && npm install tsx \
    && apk del python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev
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
