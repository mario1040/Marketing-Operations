FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=https://marketing-api.bezaverse.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run lint && npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/frontend-server.ts ./frontend-server.ts

EXPOSE 3000
CMD ["npm", "run", "start"]
