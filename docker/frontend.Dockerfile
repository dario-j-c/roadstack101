# ============================================================================
# FRONTEND DOCKERFILE - Next.js Application
# ============================================================================
# This Dockerfile creates a containerized environment for running a Next.js
# frontend application with Node.js.
#
# Key Concepts for Learners:
# - Node.js LTS: We use the "Long Term Support" version for stability
# - npm vs yarn vs pnpm: All are package managers (npm is default with Node)
# - Development mode: We're running Next.js dev server (not production build)
# - Hot reload: Code changes will automatically refresh in the browser
# ============================================================================

# ----------------------------------------------------------------------------
# BASE IMAGE
# ----------------------------------------------------------------------------
# We use Node.js 24 LTS (Long Term Support) which provides:
# - Latest stable features
# - Security updates for extended period
# - Best compatibility with modern npm packages
#
# Note: The -alpine variant is smaller but can have compatibility issues
# For teaching purposes, we use the standard version for reliability
FROM node:24

# ----------------------------------------------------------------------------
# WORKING DIRECTORY
# ----------------------------------------------------------------------------
# Set the working directory inside the container
# All subsequent commands will run from here
WORKDIR /app

# ----------------------------------------------------------------------------
# DEPENDENCY INSTALLATION
# ----------------------------------------------------------------------------
# For a bare minimum setup, we just set up the Node environment
# Learners will install Next.js and shadcn themselves
#
COPY ./frontend/package*.json ./
RUN npm ci

# ----------------------------------------------------------------------------
COPY ./frontend .

# ----------------------------------------------------------------------------
# PORT EXPOSURE
# ----------------------------------------------------------------------------
# Next.js development server runs on port 3000 by default
# This documents which port the container will use
# The actual port mapping to your host machine is done in docker-compose.yml
EXPOSE 3000

# ----------------------------------------------------------------------------
# STARTUP COMMAND
# ----------------------------------------------------------------------------
# This command runs when the container starts
#
# For Learners who haven't installed Next.js yet:
# - Keep the container running so they can exec into it
# - They can then run: npx create-next-app@latest
#
# Once Next.js is installed:
# - Replace the CMD below with: CMD ["npm", "run", "dev"]
#
# IMPORTANT: Next.js dev server must listen on 0.0.0.0 (not localhost)
# Learners may need to update their next.config.js or use:
# CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
