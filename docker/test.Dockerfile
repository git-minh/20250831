# Test Environment Dockerfile
# Provides consistent testing environment for Playwright authentication tests

FROM node:18-bullseye

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    # Browser dependencies
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    # System utilities
    curl \
    wget \
    git \
    # Debugging tools
    htop \
    netcat \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Install Playwright browsers
RUN pnpm exec playwright install --with-deps

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Create test directory structure
RUN mkdir -p tests/auth/.auth test-results playwright-report

# Set environment variables
ENV NODE_ENV=test
ENV CI=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Default command runs the test server
CMD ["pnpm", "start"]