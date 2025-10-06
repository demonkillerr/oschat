FROM node:20-alpine
WORKDIR /app
COPY ../../package*.json ./
RUN npm ci --ignore-scripts
COPY ../../apps/web ./apps/web
WORKDIR /app/apps/web
RUN npm run build
EXPOSE 3000
CMD ["npm","start"]

