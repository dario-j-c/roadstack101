# ============================================================================
# BACKEND DOCKERFILE - Django REST API
# ============================================================================
# This Dockerfile creates a containerized environment for running a Django
# backend application with Django REST Framework (DRF) and API documentation.
#
# Key Concepts for Learners:
# - Multi-stage builds: Not used here for simplicity, but worth exploring later
# - Base images: We use official Python images as our foundation
# - Layer caching: Commands are ordered to maximize Docker's layer caching
# - Working directory: Where our app lives inside the container
# ============================================================================

# ----------------------------------------------------------------------------
# BASE IMAGE
# ----------------------------------------------------------------------------
# We use Python 3.13 slim variant which includes only essential packages
# - "slim" = smaller image size (good for faster builds and deployments)
# - Alternative: "python:3.13-alpine" (even smaller but may have compatibility issues)
# - Alternative: "python:3.13" (full variant with more system packages)
FROM python:3.13-slim

# ----------------------------------------------------------------------------
# ENVIRONMENT VARIABLES
# ----------------------------------------------------------------------------
# Python-specific environment variables to optimize container behavior

# PER.NOTE (DC): I've read conflicting advice on the following steps, but they don't hurt to have
# Prevents Python from writing .pyc files (compiled bytecode)
# - .pyc files are useful for performance but not needed in containers
# - We rebuild containers frequently, so compilation cache isn't beneficial
ENV PYTHONDONTWRITEBYTECODE=1

# Forces Python output to be sent straight to terminal without buffering
# - This means we see logs in real-time (important for debugging)
# - Without this, logs might be delayed or lost if container crashes
ENV PYTHONUNBUFFERED=1

# ----------------------------------------------------------------------------
# SYSTEM DEPENDENCIES
# ----------------------------------------------------------------------------
# Install system-level packages needed by Python libraries
# Many Python packages (like psycopg2 for PostgreSQL) need C libraries

RUN apt-get update && apt-get install -y \
    # PostgreSQL client library (needed by psycopg2 if you add a database)
    libpq-dev \
    # GCC compiler (needed to build some Python packages from source)
    gcc \
    && rm -rf /var/lib/apt/lists/*
# Note: We clean up apt lists at the end to keep image size smaller

# ----------------------------------------------------------------------------
# WORKING DIRECTORY
# ----------------------------------------------------------------------------
# Set the working directory inside the container
# All subsequent commands will run from this directory
# This is where we'll copy our application code
WORKDIR /app/core

# ----------------------------------------------------------------------------
# PYTHON DEPENDENCIES
# ----------------------------------------------------------------------------
# Copy requirements file first (before copying all code)
# Why? Docker caches layers - if requirements don't change, this layer is reused
# This makes rebuilds much faster when you only change your code!

COPY ./backend/requirements.txt .

# Install Python packages
# --no-cache-dir: Don't cache package files (saves space)
# --upgrade: Ensure pip itself is up to date
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ----------------------------------------------------------------------------
# APPLICATION CODE
# ----------------------------------------------------------------------------
# Copy the entire backend directory into the container
# This happens AFTER pip install so code changes don't invalidate the pip cache
# The "." at the end means "copy to current WORKDIR" (/app)

COPY ./backend .

# ----------------------------------------------------------------------------
# PORT EXPOSURE
# ----------------------------------------------------------------------------
# Document which port the container will listen on
# This is just documentation - the actual port mapping happens in docker-compose.yml
# Django development server runs on port 8000 by default
EXPOSE 8000

# ----------------------------------------------------------------------------
# STARTUP COMMAND
# ----------------------------------------------------------------------------
# This command runs when the container starts
# For a bare minimum setup, we can just run Django's development server
#
# IMPORTANT FOR LEARNERS:
# - "0.0.0.0" means "listen on all network interfaces" (required for Docker)
# - "127.0.0.1" or "localhost" would NOT work (container would be unreachable)
# - In production, you'd use gunicorn or similar instead of runserver
#
# Learners will need to:
# 1. Run "django-admin startproject" to create their project
# 2. Update this CMD to point to their manage.py location
# 3. Run migrations before starting the server (can be done in entrypoint script)

# Run migrations, load data, then start the server
# Note: Only the last CMD is executed, so we use shell form to chain commands
CMD python manage.py migrate && \
    # Run this command manually
    # python manage.py loaddata initial_data && \
    python manage.py runserver 0.0.0.0:8000
