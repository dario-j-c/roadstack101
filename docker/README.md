# RoadStack 101

## Docker Workshop: From CLI to Compose

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

> **Note**: Modern Docker uses `docker compose` (with a space), not the old `docker-compose` command.

### A Note on File Names

You'll see two naming conventions for Compose files:
- **`compose.yml`** - Docker's official recommended name (newer)
- **`docker-compose.yml`** - The traditional name (still widely used)

Both work identically. Docker looks for files in this order: `compose.yaml`, `compose.yml`, `docker-compose.yaml`, `docker-compose.yml`. We use `docker-compose.yml` in this tutorial for clarity, but you'll see `compose.yml` in Docker's official templates and documentation.

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

```bash
docker run -it python:3.13

# You're now inside a Python environment
>>> print("Hello from Docker!")
>>> import sys
>>> print(sys.version)
>>> exit()
```

**Flags:**

- `-it`: Interactive terminal (lets you type commands)

### Try It: Web Server with Port Mapping

```bash
docker run -d -p 8080:80 --name my-web nginx:alpine
```

Visit http://localhost:8080 in your browser!

**Flags:**

- `-d`: Detached mode (runs in background)
- `-p 8080:80`: Map host port 8080 → container port 80
- `--name`: Friendly name for the container

**Quick testing with `-P` (uppercase):**

Instead of specifying exact port mappings, use `-P` to publish all exposed ports to random available ports:

```bash
docker run -d -P --name quick-test nginx:alpine

# Check which port was assigned
docker ps
# Output: 0.0.0.0:55000->80/tcp (random port like 55000)
```

This is useful for:
- Quick testing when you don't care about the exact port
- Running multiple instances without port conflicts
- CI/CD environments where port availability varies

**Cleanup:**
```bash
# See running containers
docker ps

# Stop the container
docker stop my-web

# Now docker ps shows nothing - but the container still exists (just stopped)
# Use -a to see ALL containers (including stopped ones)
docker ps -a

# Remove the stopped container
docker rm my-web
```

### The Problem

Running containers manually gets clunky:
- Long commands with many flags
- Hard to recreate the same setup
- No customization of the container environment

**Solution**: Create custom images with Dockerfiles

---

## Part 2: Building Custom Images with Dockerfiles

### What is a Dockerfile?

A **Dockerfile** is a text file containing instructions to build a custom Docker image.

### Example: Python Script Container

Create a project directory:
```bash
mkdir docker-demo && cd docker-demo
```

Create `hello.py`:
```python
print("Hello from my custom container!")
```

Create `Dockerfile`:
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY hello.py .
CMD ["python", "hello.py"]
```

Build and run:
```bash
# Build image
docker build -t my-python-app .
# Expected: Successfully built... Successfully tagged my-python-app:latest

# Run it
docker run my-python-app
# Expected: Hello from my custom container!
```

### Dockerfile Instructions

| Instruction | Purpose | Example |
|-------------|---------|---------|
| `FROM` | Base image to start from | `FROM python:3.13-slim` |
| `WORKDIR` | Set working directory in container | `WORKDIR /app` |
| `COPY` | Copy files from host to container | `COPY . .` |
| `RUN` | Execute commands during build | `RUN pip install -r requirements.txt` |
| `CMD` | Command to run when container starts | `CMD ["python", "app.py"]` |
| `EXPOSE` | Document which port app uses | `EXPOSE 8000` |
| `ENV` | Set environment variables | `ENV DEBUG=1` |

### Example: Web App with Dependencies

Create `requirements.txt`:
```txt
flask==3.1.0
```

Create `app.py`:
```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello from Flask in Docker!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

Create `Dockerfile`:
```dockerfile
FROM python:3.13-slim
WORKDIR /app

# Install dependencies first (Docker caching!)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Then copy application code
COPY app.py .

EXPOSE 5000
CMD ["python", "app.py"]
```

Build and run:
```bash
docker build -t flask-app .
docker run -p 5000:5000 flask-app
# Visit http://localhost:5000
```

**Why copy requirements.txt first?**
Docker caches each instruction. If you only change `app.py`, Docker reuses the cached `pip install` layer → much faster rebuilds!

**Inspecting image layers:**

You can see exactly what layers make up an image and how much space each takes:

```bash
# View layers (truncated commands)
docker image history flask-app

# View layers with full commands (very wide output)
docker image history --no-trunc flask-app
```

Example output:
```
IMAGE          CREATED BY                                      SIZE
a1b2c3d4e5f6   CMD ["python" "app.py"]                         0B
<missing>      COPY app.py . # buildkit                        1.2kB
<missing>      RUN pip install --no-cache-dir -r requirements  15MB    ← cached!
<missing>      COPY requirements.txt . # buildkit              50B
<missing>      WORKDIR /app                                    0B
<missing>      # base image layers...                          125MB
```

This helps you understand:
- Which layers are large (candidates for optimization)
- Which layers come from your Dockerfile vs the base image
- Why layer ordering matters for caching

**Deep inspection with `docker inspect`:**

For detailed information about any Docker object (image, container, volume, network), use `docker inspect`:

```bash
# Full JSON output (lots of information!)
docker inspect flask-app

# Extract specific fields using Go templates
docker inspect --format '{{.Config.WorkingDir}}' flask-app
# Output: /app

docker inspect --format '{{json .Config.Env}}' flask-app
# Output: ["PATH=/usr/local/bin:...", "PYTHONUNBUFFERED=1"]
```

This shows everything: environment variables, exposed ports, volumes, networking, labels, and more. The same information is available in Docker Desktop's GUI - click on any container or image to see its details in a friendlier format.

### Understanding .dockerignore

Just like `.gitignore` tells Git which files to ignore, `.dockerignore` tells Docker which files to exclude from the **build context**.

**What is the build context?**
When you run `docker build`, Docker sends the entire directory to the Docker daemon. This is called the "build context". Without a `.dockerignore`, everything gets sent - including `node_modules`, `.git`, and other large or sensitive files.

**Why does this matter?**
1. **Speed** - A 500MB `node_modules` folder takes time to transfer
2. **Security** - `.env` files with secrets could accidentally end up in your image
3. **Image size** - Unnecessary files bloat your final image
4. **Cleanliness** - No stale build artifacts or OS-specific files

**Example `.dockerignore`:**
```
# Version control
.git
.gitignore

# Dependencies (rebuilt inside container)
node_modules
__pycache__

# Environment files (NEVER include secrets in images!)
.env
.env.*

# Build artifacts
build/
dist/
.next/

# IDE and OS files
.vscode/
.DS_Store
```

> **Best Practice**: Always create a `.dockerignore` file in your project root. We've included one in this project - check it out!

### The Problem

You've built a backend... but what about:
- A frontend service?
- A database?
- Connecting multiple services together?
- Managing environment variables?

Running multiple `docker run` commands manually is tedious.

**Solution**: Docker Compose

---

## Part 3: Orchestrating Services with Docker Compose

### What is Docker Compose?

**Docker Compose** orchestrates multiple containers as one application using a single YAML configuration file.

**Key concepts:**
- **Services**: Container configurations (frontend, backend, database)
- **Volumes**: Persistent storage shared between host and containers
- **Networks**: Communication channels between containers

### docker-compose.yml Structure

```yaml
services:
  service-name:
    image: image-name        # Use pre-built image
    # OR
    build: ./path            # Build from Dockerfile
    ports:
      - "host:container"     # Port mappings
    volumes:
      - host:container       # Volume mounts
    networks:
      - network-name         # Networks to join
    depends_on:
      - other-service        # Service dependencies

volumes:
  volume-name:               # Named volumes for persistence

networks:
  network-name:              # Custom networks for isolation
```

### Example: Multi-Service Application

Create `docker-compose.yml`:
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    networks:
      - app-network
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    networks:
      - app-network
    depends_on:
      - backend

networks:
  app-network:
```

**Commands:**
```bash
# Start all services
docker compose up
# Expected: Creates network, builds images, starts containers

# Start in background (detached)
docker compose up -d

# View running services
docker compose ps

# View logs
docker compose logs
docker compose logs backend      # Specific service
docker compose logs -f           # Follow mode (live)

# Stop services
docker compose stop

# Stop and remove containers
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

### Compose Watch: Modern Hot Reload

**Compose Watch** is a newer feature that provides an alternative to volume mounts for development. Instead of sharing your entire filesystem with the container, it watches for specific changes and responds accordingly.

**Why separate files?**

Volume mounts and Compose Watch serve the same purpose but work differently. Having both in one file causes conflicts (Docker warns that watched paths won't be monitored if they're also volume-mounted). We provide two separate files:

- **`docker-compose.yml`** - Uses volume mounts (traditional approach)
- **`docker-compose.watch.yml`** - Uses Compose Watch (modern approach)

**How to use Compose Watch:**
```bash
# Start with watch mode (uses the watch-specific file)
docker compose -f docker-compose.watch.yml watch

# Stop watching: press Ctrl+C
```

**Configuration example (from docker-compose.watch.yml):**
```yaml
services:
  backend:
    build: ./backend
    develop:
      watch:
        # Sync source code changes (fast)
        - path: ./backend
          action: sync
          target: /app
          ignore:
            - __pycache__/
        # Rebuild container when dependencies change
        - path: ./backend/requirements.txt
          action: rebuild
```

**Watch actions:**
| Action | When to use | What happens |
|--------|-------------|--------------|
| `sync` | Source code changes | Files are copied to container |
| `rebuild` | Dependency changes | Container is rebuilt |
| `sync+restart` | Config changes | Files synced, container restarted |

**Benefits over volume mounts:**
- Better performance, especially on macOS and Windows
- No file permission issues between host and container
- Explicit control over what triggers rebuilds
- Cleaner separation of concerns

**When to use which:**
| Approach | File | Best for |
|----------|------|----------|
| Volume Mounts | `docker-compose.yml` | Linux, simple setup, need all files accessible |
| Compose Watch | `docker-compose.watch.yml` | macOS/Windows, explicit rebuild control |

### Service Communication

Services on the same network can reach each other by service name:

```python
# In backend, calling frontend:
response = requests.get('http://frontend:3000/api')
```

```javascript
// In frontend, calling backend:
fetch('http://backend:5000/data')
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
[+] Running 4/4
 ✔ DRY-RUN MODE -  Network roadstack101_default       Created
 ✔ DRY-RUN MODE -  Volume "roadstack101_sqlite_data"  Created
 ✔ DRY-RUN MODE -  Container roadstack-frontend       Created
 ✔ DRY-RUN MODE -  Container roadstack-backend        Created
end of 'compose up' output, interactive run is not supported in dry-run mode
```

Notice the `DRY-RUN MODE` prefix on each line - this confirms nothing was actually created.

> **Tip**: Always run `--dry-run` first when learning a new command or working with an unfamiliar compose file!

---

## Part 4: Our Full-Stack Application

Now let's apply everything to our Django + Next.js project.

### Project Structure

```
roadstack101/
├── backend/                    # Django backend
│   └── requirements.txt
├── frontend/                   # Next.js frontend
│   └── package.json
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── README.md               # This file!
├── .dockerignore               # Files excluded from Docker builds
├── docker-compose.yml          # Main config (volume mounts)
└── docker-compose.watch.yml    # Alternative config (Compose Watch)
```

### Backend Service

See `docker/backend.Dockerfile` for the full configuration. Key points:
- Base: `python:3.13-slim`
- Installs system dependencies (PostgreSQL libs, GCC)
- Copies `requirements.txt` first (caching!)
- Runs Django dev server on `0.0.0.0:8000`

### Frontend Service

See `docker/frontend.Dockerfile` for the full configuration. Key points:
- Base: `node:24`
- Will run Next.js dev server on `0.0.0.0:3000`

### Docker Compose Configuration

We provide two compose files for different development approaches:

**`docker-compose.yml`** (Volume Mounts - Traditional):
- Shares host directories directly with containers
- Simple mental model - files are just shared
- Good for Linux, works everywhere

**`docker-compose.watch.yml`** (Compose Watch - Modern):
- Watches for changes and syncs/rebuilds explicitly
- Better performance on macOS/Windows
- More control over what triggers rebuilds

Both configure:
- **Backend**: Port 8000, SQLite persistence
- **Frontend**: Port 3000
- **Networks**: Automatic communication between services

### Getting Started

**Option A: Using Volume Mounts (Recommended for beginners)**
```bash
# Preview what will happen (dry-run)
docker compose --dry-run up
# Expected: Shows containers/networks/volumes that WOULD be created

# Build and start services
docker compose up --build
# Expected: Both services start, see logs from each

# Or start in background
docker compose up -d
```

**Option B: Using Compose Watch (Recommended for macOS/Windows)**
```bash
# Preview what will happen
docker compose -f docker-compose.watch.yml --dry-run watch

# Start with file watching
docker compose -f docker-compose.watch.yml watch
# Expected: Builds, starts, then watches for file changes
# Press Ctrl+C to stop
```

**Check status (works with either approach):**
```bash
docker compose ps
# Expected: 
# NAME                   STATUS    PORTS
# roadstack-backend      running   0.0.0.0:8000->8000/tcp
# roadstack-frontend     running   0.0.0.0:3000->3000/tcp

# View logs
docker compose logs -f backend
```

### Development Workflow

**Start services:**
```bash
docker compose up -d
```

**Run Django commands:**
```bash
# Create migrations
docker compose exec backend python manage.py makemigrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Django shell
docker compose exec backend python manage.py shell
```

**Run frontend commands:**
```bash
# Install package
docker compose exec frontend npm install axios

# Run any npm command
docker compose exec frontend npm run build
```

**Open a shell in a container:**
```bash
docker compose exec backend bash
docker compose exec frontend sh
```

**View logs:**
```bash
docker compose logs -f              # All services
docker compose logs -f backend      # Specific service
```

**Restart a service:**
```bash
docker compose restart backend
```

**Rebuild after Dockerfile changes:**
```bash
docker compose up --build backend
```

**Stop everything:**
```bash
docker compose down
```

**Stop and remove volumes (⚠️ deletes data!):**
```bash
docker compose down -v
```

### Code Changes and Hot Reload

**With Volume Mounts (`docker-compose.yml`):**
1. Edit code on your host machine
2. Changes automatically sync to containers
3. Django/Next.js auto-reload on changes
4. No rebuild needed!

**With Compose Watch (`docker-compose.watch.yml`):**
1. Edit code on your host machine
2. Docker detects the change and syncs files (or rebuilds if needed)
3. Django/Next.js auto-reload on changes
4. More explicit control, better performance on macOS/Windows

---

## Quick Reference

### Docker Commands

```bash
# Images
docker images                       # List images
docker build -t name .             # Build image
docker image history image-name    # View image layers
docker image history --no-trunc image-name  # View layers (full commands)
docker inspect image-name          # Detailed image info (JSON)
docker rmi image-name              # Remove image

# Containers
docker ps                          # List running containers
docker ps -a                       # List all containers (including stopped)
docker ps -q                       # List only container IDs (useful for scripting)
docker run -it image               # Run interactively
docker run -d image                # Run detached
docker run -d -P image             # Run with random ports (ephemeral)
docker stop container              # Stop container
docker rm container                # Remove container
docker logs container              # View logs
docker exec -it container bash     # Open shell in container
docker inspect container           # Detailed container info (JSON)
docker stats                       # Live CPU/memory usage (all containers)
docker stats --no-stream           # Single snapshot (not live)

# Cleanup
docker system prune                # Remove unused data
docker system prune -a             # Remove all unused images
```

### Docker Compose Commands

```bash
# Lifecycle (using default docker-compose.yml)
docker compose build               # Build/rebuild services
docker compose up                  # Create and start services
docker compose up -d               # Start detached
docker compose --dry-run up        # Preview what would happen
docker compose start               # Start existing services
docker compose stop                # Stop services
docker compose restart             # Restart services
docker compose down                # Stop and remove containers
docker compose down -v             # Also remove volumes

# Using Compose Watch (separate file)
docker compose -f docker-compose.watch.yml watch
docker compose -f docker-compose.watch.yml --dry-run watch

# Monitoring
docker compose ps                  # List services
docker compose logs                # View logs
docker compose logs -f service     # Follow logs for service

# Execution
docker compose exec service cmd    # Run command in service
docker compose run service cmd     # Run one-off command
```

---

## Going Further: Advanced Topics

This section covers advanced patterns you might encounter or want to explore later.

### Reverse Proxies (Traefik)

In production-like setups, you often want:
- Frontend at `localhost` (no port number)
- Backend API at `localhost/api`
- Database admin at `db.localhost`

This is achieved using a **reverse proxy** - a service that routes incoming requests to the appropriate container based on the URL.

**Traefik** is a popular choice that integrates beautifully with Docker:

```yaml
services:
  proxy:
    image: traefik:v3.6
    command: --providers.docker
    ports:
      - 80:80
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  backend:
    build: ./backend
    labels:
      # Route localhost/api/* to this service
      traefik.http.routers.backend.rule: Host(`localhost`) && PathPrefix(`/api`)
      traefik.http.services.backend.loadbalancer.server.port: 8000

  frontend:
    build: ./frontend
    labels:
      # Route all other localhost requests to this service
      traefik.http.routers.frontend.rule: Host(`localhost`)
      traefik.http.services.frontend.loadbalancer.server.port: 3000
```

**How it works:**
1. Traefik listens on port 80
2. It reads Docker container labels to learn routing rules
3. Requests to `localhost/api/*` go to the backend
4. All other requests to `localhost` go to the frontend
5. No port numbers needed in URLs!

**Why we don't use it in this tutorial:**
- Adds complexity for beginners
- Requires understanding of routing rules and DNS
- Port-based access (`:3000`, `:8000`) is simpler for learning

**When you'd want it:**
- Simulating production environment
- Running multiple services on the same port
- When you need clean URLs without port numbers

> **Note**: Docker's official templates use Traefik. See their [docker/getting-started-todo-app](https://github.com/docker/getting-started-todo-app) for a full example.

### Health Checks

Health checks let Docker know when a service is actually ready (not just running):

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

This prevents race conditions where your backend starts before the database is ready to accept connections.

### Monitoring Resource Usage

Use `docker stats` to see live CPU, memory, and network usage for your containers:

```bash
# Live updating stats (press Ctrl+C to exit)
docker stats

# Single snapshot (useful for scripts)
docker stats --no-stream
```

Example output:
```
CONTAINER ID   NAME                CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
d869adc3ecce   roadstack-backend   0.15%     85.2MiB / 3.8GiB      2.18%     1.2MB / 850kB
693a741f7a86   roadstack-frontend  0.08%     120.5MiB / 3.8GiB     3.07%     2.1MB / 1.5MB
```

This helps you:
- Identify memory leaks or CPU-heavy processes
- Right-size container resource limits
- Debug performance issues

The same information is available in Docker Desktop's GUI under the "Containers" view.

---

## Key Takeaways

### The Journey

1. **Docker CLI** → Run pre-built images, but manual and clunky
2. **Dockerfile** → Build custom images, but still managing multiple containers manually
3. **Docker Compose** → Orchestrate everything with one command

### Core Concepts

- **Image**: Blueprint (built from Dockerfile)
- **Container**: Running instance (isolated process)
- **Volume**: Persistent storage (survives container deletion)
- **Network**: Communication between containers

### Why Docker?

✅ **Consistency** - Works the same everywhere
✅ **Isolation** - No dependency conflicts
✅ **Speed** - New developers productive in minutes
✅ **Simplicity** - One command runs entire stack

---

## Next Steps

1. **Explore the detailed comments** in the project files:
   - `docker/backend.Dockerfile` - Backend container setup
   - `docker/frontend.Dockerfile` - Frontend container setup
   - `docker-compose.yml` - Service orchestration
   - `backend/requirements.txt` - Python dependencies

2. **Experiment**:
   - Add a Python package to `requirements.txt`, rebuild
   - Modify Django settings, see auto-reload
   - Add environment variables to `docker-compose.yml`

3. **Learn more**:
   - [Official Docker Documentation](https://docs.docker.com/)
   - [Docker Compose Documentation](https://docs.docker.com/compose/)
   - [Docker Hub](https://hub.docker.com/)
