# Use the official Node.js base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Install the necessary fonts
RUN apt-get update && apt-get install -y \
  fonts-dejavu \
  fontconfig \
  build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Copy the package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the application code
COPY index.js .
COPY images /app/images
COPY assets /app/assets
COPY public /app/public
COPY uploads /app/uploads

# Expose the port the app runs on
EXPOSE 4321

# Command to run the application
CMD ["npm", "start"]

