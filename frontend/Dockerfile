# Multi-stage: Node 20 build, then nginx serving the SPA.
# Vite bakes VITE_* at build time. Compose passes VITE_API_BASE_URL=/api
# (same-origin; nginx proxies /api → backend) and VITE_MAPBOX_TOKEN.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=/api
ARG VITE_MAPBOX_TOKEN=pk.eyJ1IjoibXV0aHVzaHJpNzg2IiwiYSI6ImNtdTZ1eGcwZTBnM2UzMXF4bW02eGY3cm4ifQ.i008sawBdvqC266psI_0NA
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

FROM nginx:alpine
# Template is envsubst'd at boot: PORT (80 locally, Railway-assigned in cloud)
# and API_UPSTREAM (compose: backend:8080, Railway: backend.railway.internal:8080).
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=80
ENV API_UPSTREAM=backend:8080
ENV NGINX_ENVSUBST_FILTER=PORT|API_UPSTREAM
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
