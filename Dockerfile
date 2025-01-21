# Base Image
FROM node:22-alpine AS base

# Set Working Directory
WORKDIR /app

RUN apk add --no-cache bash

# Copy Package Files
COPY package*.json ./

# Install Dependencies
RUN npm install --only=production

# Copy Application Code
COPY . .

# Copy the wait-for-it.sh script into the container
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh

# Make the wait-for-it.sh script executable
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Expose Application Port
EXPOSE 3000

# Run Application
CMD ["npm", "run", "start:prod"]
