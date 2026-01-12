# Fam Point

This is a Next.js project.

## Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) (for local database)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```


### Local Database Setup (MongoDB)

This project uses MongoDB. The easiest way to run it locally is with Docker.

1.  **Start MongoDB**:
    ```bash
    docker-compose up -d
    ```
    This will start a MongoDB instance on port `27017` with default credentials (`root`/`password`).

2.  **Configure Environment**:
    Create a `.env.local` file in the root directory if it doesn't exist, and add the connection string:
    ```env
    MONGODB_URI=mongodb://root:password@localhost:27017/fam-point?authSource=admin
    ```

### Running Locally

To start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

> **Note:** The development server is configured to run on port **9002**.

## Building for Production

To build the application for production usage:

```bash
npm run build
```

To start the production server after building:

```bash
npm run start
```

## Deployment on Ubuntu (Docker)

This section guides you through deploying the application on an Ubuntu server using Docker, specifically when you already have a MongoDB instance running in a container.

### 1. Preparation
Ensure your Ubuntu server has Docker and Docker Compose installed.

### 2. Configure Network
If your MongoDB is already running in a Docker container, it's best to have the application and MongoDB on same Docker network.

Check the network of your MongoDB container:
```bash
docker inspect <mongodb-container-name> -f '{{json .NetworkSettings.Networks}}'
```

### 3. Environment Variables
Create a file named `.env.prod` on your server:
```env
MONGODB_URI=mongodb://root:password@mongodb:27017/fam-point?authSource=admin
```
*(Note: Replace `mongodb` with the actual container name of your Mongo instance if they are on the same network)*

### 4. Dockerize the App
The project includes a `Dockerfile` for production. 

### 5. Deploy with Docker Compose
We use `docker-compose.prod.yml` for deployment:

1. **Edit `docker-compose.prod.yml`**:
   Ensure the `networks` section matches your existing Docker network (e.g., `common-network`).

2. **Run Deployment**:
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

### 6. Reverse Proxy (Nginx)
Since you are running multiple apps on the same server, use Nginx to route traffic to your container on port `9002`.

Example Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
