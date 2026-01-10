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

### Genkit Development

This project uses [Genkit](https://firebase.google.com/docs/genkit) for AI features.

To start Genkit development tools:
```bash
npm run genkit:dev
```

To run Genkit in watch mode:
```bash
npm run genkit:watch
```

## Building for Production

To build the application for production usage:

```bash
npm run build
```

To start the production server after building:

```bash
npm run start
```
