# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /usr/src/app

# Install dependencies including devDependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Run (production only)
FROM node:18-alpine
WORKDIR /usr/src/app

# Only copy package.json and install prod deps
COPY package*.json ./
RUN npm ci --only=production

# Copy built JS from builder
COPY --from=build /usr/src/app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port 8080 (Cloud Run standard)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the app
CMD ["node", "dist/index.js"]
