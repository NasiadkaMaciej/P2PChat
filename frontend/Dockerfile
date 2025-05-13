FROM node:23-alpine

WORKDIR /app

COPY package*.json ./

# Add build arguments
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

RUN npm install

COPY . .

# Build the app if in production mode
RUN if [ "$NODE_ENV" = "production" ] ; then npm run build ; fi

# Different commands depending on environment
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ] ; then npm start ; else npm run dev ; fi"]