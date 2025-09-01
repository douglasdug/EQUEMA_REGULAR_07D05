FROM node:20-alpine AS build
WORKDIR /app

# Copia solo package.json y lock para instalar dependencias primero
COPY package*.json ./
RUN npm install

# Ahora copia el resto del código
COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf