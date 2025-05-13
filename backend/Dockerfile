FROM node:23-alpine

WORKDIR /app

COPY package*.json ./

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

RUN npm install

COPY . .

# Expose the port specified in .env
ARG BACKEND_PORT=5000
EXPOSE ${BACKEND_PORT}

CMD ["npm", "start"]