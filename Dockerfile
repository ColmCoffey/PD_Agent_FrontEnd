# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# COPY yarn.lock . # Uncomment if using yarn

# Install dependencies
RUN npm install
# RUN yarn install # Uncomment if using yarn

# Copy the rest of the application code
COPY . .

# Build the application for production
# Pass API URL as build argument (can be overridden at build time)
ARG REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Stage 2: Serve the static files using a lightweight web server
FROM nginx:1.25-alpine

# Copy the build output from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy a custom Nginx configuration file (optional but recommended for SPAs)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]

# Note: For deployment with Lambda/API Gateway, this frontend container
# might not be used directly. Instead, the build output (`/app/build`)
# could be deployed to S3 and served via CloudFront, with API Gateway
# proxying requests to the backend Lambda.
