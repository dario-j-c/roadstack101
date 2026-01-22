# RoadStack 101

## Docker Workshop: From CLI to Compose

---

## Our Goal: One Command to Run Everything

By the end of this hour, we will understand exactly what happens when you run a single command to launch a full-stack web application. The command looks like this:

```bash
docker compose up --build
```


This command will:

1.  Read your `docker-compose.yml` file.
2.  Build the custom `backend` and `frontend` images using their respective `Dockerfile`s.
3.  Start containers for each service.
4.  Connect them on a shared network so they can communicate.

Our journey is to break down this "magic" step by step, starting with the most basic Docker commands and building up to the full `docker compose` orchestration.

---

### Project Structure

This diagram shows the key files we will be discussing. It provides a map of the repository that will be useful as we go through the workshop.

```
roadstack101/
├── backend/                    # Django backend
│   └── core/                   # Code
│   └── requirements.txt
├── frontend/                   # Next.js frontend
│   └── package.json [TBD]
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── README.md               # **This file**
├── .dockerignore               # Files excluded from Docker builds
├── docker-compose.yml          # Main config (volume mounts)
└── docker-compose.watch.yml    # Alternative config (Compose Watch)
```

---

## Prerequisites

Before starting, you need:

- **Docker Desktop** (includes Docker Engine and Docker Compose)
  - **macOS**: [Download Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
  - **Windows**: [Download Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
  - **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose plugin](https://docs.docker.com/compose/install/linux/)

### Verify Installation

```bash
docker --version
# Expected: Docker version 27.x.x or higher

docker compose version
# Expected: Docker Compose version v2.x.x or higher
```

> **Note**: Modern Docker uses `docker compose` (with a space). The older `docker-compose` (with a hyphen) command still works and now points to the same underlying implementation, so both produce identical results. You may see either syntax in tutorials online.

### A Note on File Names

You'll see two naming conventions for Compose files:
- **`compose.yaml`** - Docker's official recommended name (newer)
- **`docker-compose.yml`** - The traditional name (still widely used)

Both work identically. Docker looks for files in this order: `compose.yaml`, `compose.yml`, `docker-compose.yaml`, `docker-compose.yml`. We use `docker-compose.yml` in this tutorial for clarity, but you'll see `compose.yaml` in Docker's official templates and documentation. See [here](https://docs.docker.com/compose/intro/compose-application-model/#the-compose-file) for further details.

---

## Part 1: Understanding Docker with the CLI

### What is Docker?

Docker packages your application and its dependencies into **containers** - isolated, lightweight environments that run consistently anywhere.

**Key concepts:**

- **Image**: A blueprint for a container (like a class in programming)
- **Container**: A running instance of an image (like an object)
- **Docker Hub**: A registry of pre-built images (like npm or PyPI)

### Try It: Run Your First Container

```bash
docker run hello-world
```

**What happened?**

1. Docker looked for `hello-world` image locally
2. Didn't find it, downloaded from Docker Hub
3. Created and ran a container
4. Container printed message and exited

### Try It: Interactive Python Container

First, note our current local python setup and its version.

```bash
python3 --version
```

```bash
docker run -it python:3.13

# You're now inside a Python environment
>>> print("Hello from Docker!")
>>> import sys
>>> print(sys.version)
>>> exit()
```

After exiting, you can see this container listed in Docker Desktop's "Containers" tab (the status icon will be an empty circle outline indicating it's stopped).

**Flags:**

- `-it`: Interactive terminal (lets you type commands)

### Try It: Web Server with Port Mapping

```bash
docker run -d -p 8080:80 --name my-web nginx:alpine
```

Visit http://localhost:8080 in your browser.

**Flags:**

- `-d`: Detached mode (runs in background)
- `-p 8080:80`: Map host port 8080 → container port 80
- `--name`: Friendly name for the container

**Quick testing with `-P` (uppercase):**

Instead of specifying exact port mappings, use `-P` to publish all exposed ports to random available ports from your system's [ephemeral port range](https://docs.docker.com/reference/cli/docker/container/run/#publish-all) (defined by `/proc/sys/net/ipv4/ip_local_port_range` on Linux).

```bash
docker run -d -P --name quick-test nginx:alpine

# Check which port was assigned
docker ps
# Output: 0.0.0.0:55000->80/tcp (port assigned from system's ephemeral range)
```

This is useful for:

- Quick testing when you don't care about the exact port
- Running multiple instances without port conflicts
- CI/CD environments where port availability varies

**Cleanup:**
```bash
# See running containers (also visible in Docker Desktop's "Containers" tab)
docker ps

# Stop the container
docker stop my-web

# Now docker ps shows nothing - but the container still exists (just stopped)
# Use -a to see ALL containers (including stopped ones)
docker ps -a

# Remove the stopped container
docker rm my-web

# We can clenup quick-test via the GUI
```

### The Problem

Running containers manually gets clunky:

- Long commands with many flags
- Hard to recreate the same setup
- No customization of the container environment

**Solution**: Create custom images with Dockerfiles

Now, let's see how Dockerfiles help us automate this for our own project.

---

## Part 2: Building Custom Images with Dockerfiles

### What is a Dockerfile?

A **Dockerfile** is a text file containing instructions to build a custom Docker image. It's the recipe for your container. Instead of running `docker run` with a lot of flags, you define the configuration once in a Dockerfile.

### This Project's Backend Dockerfile

Let's examine this project's actual backend Dockerfile. You can find it at `docker/backend.Dockerfile`.

We won't build this manually with `docker build` yet (we'll let Docker Compose do it in Part 3), but we will walk through it line-by-line to understand what it does.

Here is the file:
```dockerfile
# ============================================================================
# BACKEND DOCKERFILE - Django REST API
# ============================================================================
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/core

COPY ./backend/requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY ./backend .

EXPOSE 8000

CMD python manage.py makemigrations && \
    python manage.py migrate && \
    python manage.py fetch_data && \
    python manage.py runserver 0.0.0.0:8000
```

### Dockerfile Instructions Explained

| Instruction | Purpose | Example from our file |
|-------------|---------|-----------------------|
| `FROM` | Base image to start from | `FROM python:3.13-slim` |
| `ENV` | Set environment variables | `ENV PYTHONUNBUFFERED=1` |
| `RUN` | Execute commands during build | `RUN apt-get update && ...` |
| `WORKDIR` | Set working directory in container | `WORKDIR /app/core` |
| `COPY` | Copy files from host to container | `COPY ./backend/requirements.txt .` |
| `EXPOSE` | Document which port app uses | `EXPOSE 8000` |
| `CMD` | Command to run when container starts | `CMD python manage.py ...` |

### Line-by-Line Breakdown

- `FROM python:3.13-slim`
  - Every Dockerfile starts with a `FROM` instruction. This specifies the **base image**. We're using the official `python` image, specifically the `3.13-slim` tag. "Slim" means it's a smaller version with only the essential packages, leading to a smaller final image size.

- `ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1`
  - `ENV` sets environment variables inside the container.
  - `PYTHONDONTWRITEBYTECODE=1`: Prevents Python from creating `.pyc` files. This is good for containers where we rebuild frequently.
  - `PYTHONUNBUFFERED=1`: Ensures that Python output (like `print` statements) is sent directly to the terminal without buffering. This is critical for seeing logs in real-time.

- `RUN apt-get update && ...`
  - `RUN` executes commands *during the build process*. We use it here to install system-level packages inside the container. `libpq-dev` and `gcc` are libraries that might be needed to install some Python packages from source.

- `WORKDIR /app/core`
  - `WORKDIR` sets the working directory for all subsequent commands (`RUN`, `CMD`, `COPY`, etc.). If the directory doesn't exist, it will be created.

- `COPY ./backend/requirements.txt .`
  - `COPY` copies files from your host machine into the container. Here, we're copying just the `requirements.txt` file into our working directory (`/app/core`).

- `RUN pip install ...`
  - Another `RUN` command, this time using `pip` to install our Python dependencies.

- **The Caching Trick**: Why did we `COPY` `requirements.txt` separately before copying the rest of the code? **Layer Caching!** Docker builds images in layers. Each instruction in the Dockerfile is a layer. If a file hasn't changed, Docker uses the cached layer from the previous build.
  - Since `requirements.txt` changes less often than our source code, we copy it first. Now, if you only change a Python file, Docker will re-use the (potentially very long) `pip install` layer, making your builds much, much faster.
  - You can use `docker image history <image-name>` to inspect these layers and see how much space each one takes. This information is also visible in Docker Desktop under the "Images" tab.
  - **Advanced**: There's also a `docker commit` command that lets you create a new image from a running container's current state. This is not the standard workflow (Dockerfiles are preferred for reproducibility), but it can be useful for debugging or creating quick snapshots. 

- `COPY ./backend .`
  - Now we copy the rest of our backend code into the working directory.

- `EXPOSE 8000`
  - `EXPOSE` is documentation. It tells Docker that the container listens on port 8000. It doesn't actually *publish* the port. We do that later with `docker compose` or `docker run -p`.

- `CMD python ...`
  - `CMD` specifies the default command to run when the container starts. Here, we're chaining a few commands to prepare the database and then start the Django development server.
  - **Important**: The server must run on `0.0.0.0` to be accessible from outside the container. `localhost` or `127.0.0.1` would not work.

### What About the Frontend?

The `docker/frontend.Dockerfile` follows a very similar pattern, but for a Node.js application.

```dockerfile
FROM node:24
WORKDIR /app
COPY ./frontend .
EXPOSE 3000
CMD ["tail", "-f", "/dev/null"]
```
- **`FROM node:24`**: The base image is `node` version 24 (a Long-Term Support version).
- **`WORKDIR /app`**: A different working directory, it doesn't matter that it's the same as the backend since they are in separate, isolated containers.
- **`COPY ./frontend .`**: Copies the frontend code. For a real application, you would first copy `package.json` and run `npm install` to take advantage of layer caching, just like we did with `requirements.txt`.
- **`CMD ["tail", "-f", "/dev/null"]`**: This is a placeholder command that keeps the container running so you can `exec` into it and run commands like `npm install` and `npm run dev`.

### Understanding .dockerignore

Just like `.gitignore`, a `.dockerignore` file tells Docker which files to exclude from the **build context**. When you run `docker build`, the entire directory (the context) is sent to the Docker daemon. A `.dockerignore` file prevents large or sensitive files (like `.git`, `node_modules`, or `.env`) from being sent, which speeds up builds and improves security.

> **Best Practice**: We have a `.dockerignore` in the project root. Take a look to see what we're excluding.

### The Problem

We've automated the setup for our backend. But what about the frontend? Or a database? How do we connect them?

Running and managing multiple `docker build` and `docker run` commands would be a pain.

**Solution**: Docker Compose

---

## Part 3: Orchestrating Services with Docker Compose

### What is Docker Compose?

**Docker Compose** orchestrates multiple containers as one application using a single YAML configuration file.

**Key concepts:**

- **Services**: Container configurations (frontend, backend, database)
- **Volumes**: Persistent storage shared between host and containers
- **Networks**: Communication channels between containers

### This Project's Docker Compose File

Now let's look at the `docker-compose.yml` file in the root of our project.
This file defines our full application stack: the frontend service and the backend service.

Here's a simplified version of the file:
```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: ./docker/frontend.Dockerfile
    container_name: roadstack-frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: ./docker/backend.Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - sqlite_data:/app/core/db
    restart: unless-stopped

volumes:
  sqlite_data:
```

### Service-by-Service Breakdown

- **`services`**: This is the main key where we define each container that makes up our application. We have two: `frontend` and `backend`.

- **`frontend:`**: This is our Next.js application.
  - **`build:`**: Instead of pulling a pre-built image from Docker Hub (`image: ...`), we're telling Compose to build the image itself.
    - **`context: .`**: The build context is the project's root directory.
    - **`dockerfile: ./docker/frontend.Dockerfile`**: We point it to the specific Dockerfile to use.
  - **`ports: - "3000:3000"`**: This maps port 3000 on your host machine to port 3000 inside the container. This is how you can access the Next.js app at `http://localhost:3000`.
  - **`volumes:`**: This is how we enable hot-reloading. We'll discuss this in detail below.

- **`backend:`**: This is our Django application.
  - **`build:`**: Same as the frontend, we point it to our `backend.Dockerfile`.
  - **`ports: - "8000:8000"`**: Maps your `localhost:8000` to the container's port 8000, where Django's `runserver` is listening.
  - **`volumes:`**: We mount the backend code and also a special "named volume" for the database.

- **`volumes: sqlite_data:`**: This top-level key defines the named volume used by the backend service to persist the SQLite database file.

### Running the Application

This is the moment we saw in the "Our Goal" section. To build and run this entire stack, you only need one command:

```bash
# Build the images and start the containers
docker compose up --build

# To run in the background (detached mode)
docker compose up --build -d
```

**What happens?**

1. Docker Compose reads the `docker-compose.yml` file.
2. It sees two services: `frontend` and `backend`.
3. It runs `docker build` for each service using the specified Dockerfiles, creating a `roadstack101-frontend` and `roadstack101-backend` image.
4. It creates a virtual network that both containers will join.
5. It starts a container from each image.
6. It maps the ports and attaches the volumes as specified.

**Other useful commands:**
```bash
# View the status of your running services
docker compose ps

# View the logs from all services
docker compose logs

# Follow the logs in real-time for one service
docker compose logs -f backend

# Stop and remove the containers
docker compose down
```

### Understanding Volumes

**Problem**: Container filesystems are ephemeral - data disappears when containers are removed.

**Solution**: Volumes persist data outside containers.

**Volume types:**

1. **Host volumes (bind mounts)** - Share a host directory with container
   ```yaml
   volumes:
     - ./backend:/app       # Host ./backend ↔ Container /app
   ```
   **Use case**: Development (live code editing)

2. **Named volumes** - Docker-managed storage
   ```yaml
   services:
     backend:
       volumes:
         - db_data:/app/db  # Named volume
   
   volumes:
     db_data:               # Define at root level
   ```
   **Use case**: Database persistence, uploads

> **Note**: Older Docker versions used "anonymous volumes" (e.g., `/app/node_modules`), but **named volumes are now recommended** for better management.

### Two Development Approaches: Bind Mounts vs. Watch

This project offers two ways to handle code synchronization for development, configured in two separate files. While they achieve a similar goal (seeing your code changes in the container without a manual rebuild), they work differently.

1.  **`docker-compose.yml`**: Uses **Bind Mounts**.
2.  **`docker-compose.watch.yml`**: Uses **Compose Watch**.

#### Bind Mounts (The Traditional Approach)

As seen in `docker-compose.yml`, a bind mount directly maps a host directory into a container (e.g., `volumes: - ./backend:/app`).

-   **Philosophy**: Implicit Sync. The container's directory *is* the host directory. It's simple and intuitive.
-   **How it works**: The Docker engine keeps the two directories in sync. Historically, this was slow on macOS and Windows, but performance has improved dramatically with new technologies like `virtiofs`.

#### Compose Watch (The Modern Approach)

As seen in `docker-compose.watch.yml`, `watch` mode is configured under a `develop` key.

-   **Philosophy**: Explicit Sync. You define specific rules for how the container should react to file changes.
-   **How it works**: Instead of syncing the entire directory, `watch` listens for file change events and acts on them according to your rules.
    -   `action: sync`: Copies only the changed files into the container.
    -   `action: rebuild`: Triggers a full `docker build` for the service. This is perfect for when you change a dependency file like `requirements.txt`.

#### How to Choose in 2026

Thanks to performance improvements in Docker Desktop, **both methods are now fast and effective for development on all operating systems.** The choice is no longer about performance, but about your preferred workflow.

| Approach | File | Best for... |
|---|---|---|
| Bind Mounts | `docker-compose.yml` | **Simplicity.** Choose this if you want a straightforward, easy-to-understand setup where the container is a direct mirror of your host files. |
| Compose Watch | `docker-compose.watch.yml` | **Granular Control.** Choose this if you want to define explicit rules, like ignoring certain files (e.g. `node_modules`) or triggering full rebuilds on specific file changes (`package.json`). |

For this workshop, you can use either. The `docker-compose.yml` file is slightly simpler to start with.

**To run with Compose Watch:**
```bash
docker compose -f docker-compose.watch.yml watch
```

### Service Communication

Services on the same network can reach each other by service name. The container port is used, not the host port that is published.

```python
# In backend, calling frontend:
response = requests.get('http://frontend:3000/api')
```

```javascript
// In frontend, calling backend:
// We use port 8000 because that's the port the backend container exposes
fetch('http://backend:8000/data')
```

### Dry Run Mode: Preview Without Executing

The `--dry-run` flag lets you see what Docker Compose **would do** without actually doing it. This is invaluable for:

- Understanding what a command will create/modify/delete
- Learning how Docker Compose works
- Verifying your configuration before running it
- Debugging issues without side effects

**Usage:**
```bash
# Preview "docker compose up" - what containers/networks/volumes would be created?
docker compose --dry-run up

# Preview with build - what would be built?
docker compose --dry-run up --build

# Preview watch mode - what would be watched?
docker compose -f docker-compose.watch.yml --dry-run watch

# Preview teardown - what would be removed?
docker compose --dry-run down
```

**Example output:**
```
[+] Running 8/8
 ✔ DRY-RUN MODE -  ==> ==> writing image dryRun-...
 ✔ DRY-RUN MODE -  ==> ==> naming to roadstack101-frontend
 ✔ DRY-RUN MODE -  backend                                                               Built
 ✔ DRY-RUN MODE -  frontend                                                              Built
 ✔ DRY-RUN MODE -  Network roadstack101_default                                          Created
 ✔ DRY-RUN MODE -  Volume "roadstack101_sqlite_data"                                     Created
 ✔ DRY-RUN MODE -  Container roadstack-frontend                                          Started
 ✔ DRY-RUN MODE -  Container roadstack-backend                                           Started
```

Notice the `DRY-RUN MODE` prefix on each line - this confirms nothing was actually created.

> **Tip**: It's useful to run `--dry-run` first when learning a new command or working with an unfamiliar compose file!

---

## Part 4: Your Daily Development Workflow

Now that you have the application running, here is a cheat sheet of common commands for interacting with the services.

### Common Commands

The `docker compose exec` command is your main tool for running commands *inside* a running container.

**Run Django commands:**

The other tutorials will speak to these.

```bash
# Create migrations for your models
docker compose exec backend python manage.py makemigrations

# Apply migrations to the database
docker compose exec backend python manage.py migrate

# Create an admin user
docker compose exec backend python manage.py createsuperuser

# Open a Django shell
docker compose exec backend python manage.py shell
```

**Run frontend commands:**
```bash
# Install a new npm package
docker compose exec frontend npm install axios

# Run any npm command (e.g., a build script)
docker compose exec frontend npm run build
```

**Open an interactive shell in a container:**
This is useful for debugging or running multiple commands.
```bash
# Open a bash shell in the backend container
docker compose exec backend bash

# Open a sh shell in the frontend container
docker compose exec frontend sh
```

### Monitoring and Management

**View logs:**
```bash
# Follow the logs for all services
docker compose logs -f

# Follow the logs for a specific service
docker compose logs -f backend
```

**Restart a single service:**
```bash
docker compose restart backend
```

**Rebuild after changing a Dockerfile:**
If you make changes to `backend.Dockerfile` or `frontend.Dockerfile`, you need to rebuild the image.
```bash
docker compose up --build backend
```

**Stop everything:**
```bash
docker compose down
```

**Stop and delete all data (!!!USE WITH CAUTION!!!):**
This command stops the containers and also removes the named volume `sqlite_data`, deleting your database.
```bash
docker compose down -v
```

### Code Changes and Hot Reload

This is a reminder of the two development approaches you can use.

**With Volume Mounts (`docker-compose.yml`):**

1. Run `docker compose up -d`.
2. Edit code on your host machine.
3. Changes automatically sync to the containers.
4. Django and Next.js will detect the changes and auto-reload.

**With Compose Watch (`docker-compose.watch.yml`):**

1. Run `docker compose -f docker-compose.watch.yml watch`.
2. Edit code on your host machine.
3. Docker detects the change and either syncs the file or rebuilds the container, based on the rules in the `watch` section.
4. Django and Next.js will auto-reload.

---

## Key Takeaways

### The Journey

1. **Docker CLI** → Run pre-built images, but manual and clunky.
2. **Dockerfile** → Build custom, reproducible images, but still managing one container at a time.
3. **Docker Compose** → Orchestrate a full multi-service application with a single command.

### Core Concepts

- **Image**: A blueprint or recipe for your environment (built from a Dockerfile).
- **Container**: A live, running instance of an image.
- **Volume**: A mechanism for persisting data outside a container's ephemeral filesystem.
- **Network**: A private communication channel that allows containers to talk to each other.

### Why Docker?

- **Consistency** - It works the same on your machine, your teammate's machine, and in the cloud.
- **Isolation** - No more "it works on my machine!" problems caused by dependency conflicts.
- **Speed** - New developers can be productive in minutes instead of spending a day on setup.
- **Simplicity** - The entire application stack is defined and managed in one place.

---

## Next Steps

1. **Explore the detailed comments** in the project files:

   - `docker/backend.Dockerfile`
   - `docker/frontend.Dockerfile`
   - `docker-compose.yml`
   - `docker-compose.watch.yml`

2. **Experiment**:

   - Add a new Python package to `backend/requirements.txt`, then run `docker compose up --build backend` to see the change.
   - Add an environment variable to a service in `docker-compose.yml`.
   - Advanced: Try to add a new service, like a Redis cache.

3. **Learn more**:

   - [Official Docker Documentation](https://docs.docker.com/)
   - [Docker Compose Documentation](https://docs.docker.com/compose/)
   - [Docker CLI cheat sheet](https://docs.docker.com/get-started/docker_cheatsheet.pdf)

---

## Appendix A: Advanced Topics

This section covers advanced patterns you might encounter or want to explore after mastering the basics.

### Reverse Proxies (Traefik)

In production-like setups, you often want a single entry point to your application:

- Frontend at `localhost` (no port number)
- Backend API at `localhost/api`

This is achieved using a **reverse proxy**. **Traefik** is a popular choice that integrates beautifully with Docker. It reads container "labels" to automatically route traffic.

**Why we don't use it in this tutorial:**

- It adds an extra layer of complexity for beginners.
- Port-based access (`:3000`, `:8000`) is simpler and more explicit for learning.

### Health Checks

A `healthcheck` instruction in your `docker-compose.yml` file tells Docker when your service is *actually ready* to receive traffic, not just when the container has started. This is crucial for preventing race conditions, for example, ensuring a database container is fully initialized before the backend tries to connect to it.

```yaml
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy  # Wait for DB to be truly ready
```

### Monitoring Resource Usage

The `docker stats` command provides a live view of the CPU, memory, and network usage of your running containers. It's an invaluable tool for debugging performance issues or identifying resource-hungry services. The same information is available in Docker Desktop's "Containers" view, which shows resource graphs for each container.

```bash
# Live updating stats (press Ctrl+C to exit)
docker stats

# Single snapshot (useful for scripts)
docker stats --no-stream
```

### Alternatives to Docker

Docker is the industry standard, but there are alternatives worth knowing about:

- **[Podman](https://podman.io)** - An open-source, daemonless container engine developed by Red Hat. It's compatible with Docker commands and doesn't require root privileges. See [What is Podman?](https://www.redhat.com/en/topics/containers/what-is-podman) for more details.

---

## Appendix B: Command Quick Reference

### Docker Commands

```bash
# Images
docker images                       # List images
docker build -t name .             # Build image
docker image history image-name    # View image layers
docker rmi image-name              # Remove image

# Containers
docker ps                          # List running containers
docker ps -a                       # List all containers
docker run -it image               # Run interactively
docker run -d image                # Run detached
docker stop container              # Stop container
docker rm container                # Remove container
docker logs container              # View logs
docker exec -it container bash     # Open shell in container
docker inspect container           # Detailed container info (JSON, also in Desktop GUI)

# Monitoring
docker stats                       # Live CPU/memory usage (Ctrl+C to exit)
docker stats --no-stream           # Single snapshot

# System
docker system prune                # Remove unused data (containers, networks)
docker system prune -a             # Also remove unused images
```

### Docker Compose Commands

```bash
# Lifecycle (using default docker-compose.yml)
docker compose up                  # Create and start services
docker compose up -d               # Start detached
docker compose up --build          # Build images then start
docker compose down                # Stop and remove containers
docker compose down -v             # Also remove volumes (deletes data)
docker compose start / stop / restart

# Using Compose Watch (with the watch-specific file)
docker compose -f docker-compose.watch.yml watch

# Monitoring
docker compose ps                  # List services
docker compose logs                # View logs for all services
docker compose logs -f service     # Follow logs for a service

# Execution
docker compose exec service cmd    # Run command in a running service
```
