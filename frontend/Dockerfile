# Use Node.js as the base image
FROM node:20-slim

# Set work directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Build arguments
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI

# Set environment variables for build
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI

# Copy project files
COPY . .

# Build for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "run", "start"]
