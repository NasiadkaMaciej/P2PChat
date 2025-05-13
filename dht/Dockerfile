FROM node:23-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Default port
ARG PORT=3478
ENV PORT=${PORT}

# Expose the port
EXPOSE ${PORT}

# Run the application
CMD ["npm", "start"]