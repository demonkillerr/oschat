FROM node:20-alpine
WORKDIR /app
COPY ../../package*.json ./
RUN npm ci --ignore-scripts
COPY ../../apps/server ./apps/server
WORKDIR /app/apps/server
EXPOSE 4000
CMD ["npm","start"]

