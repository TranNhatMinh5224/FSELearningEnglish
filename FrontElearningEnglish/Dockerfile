# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine

# Copy built assets from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Custom Nginx configuration (Optional - but recommended for React Router)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
