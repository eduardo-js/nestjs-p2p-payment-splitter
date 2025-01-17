# Base Image
FROM node:22-alpine AS base

# Set Working Directory
WORKDIR /app

# Copy Package Files
COPY package*.json ./

# Install Dependencies
RUN npm install --only=production

# Copy Application Code
COPY . .

# Expose Application Port
EXPOSE 3000

# # Run Application
CMD ["npm", "run", "start:prod"]
