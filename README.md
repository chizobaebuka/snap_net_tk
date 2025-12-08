
# Workforce Management System API

A scalable, modular backend tailored for high-traffic workforce management. Built with **NestJS**, **MySQL**, **RabbitMQ**, and **Redis**.

## 🚀 Features

*   **Scalable Architecture**: Service-Repository pattern with clear separation of concerns.
*   **Asynchronous Processing**: Leave requests are processed via RabbitMQ workers to offload the main API.
*   **Reliability**:
    *   **Exponential Backoff Retry**: Automatic retries for failed jobs.
    *   **Dead Letter Queue (DLQ)**: Failed messages are isolated for inspection.
    *   **Idempotency**: Prevents duplicate processing of the same request.
*   **Performance**:
    *   **Redis Caching**: Caches high-frequency employee lookups.
    *   **Rate Limiting**: Protects against abuse (Throttler).
    *   **Pagination**: Optimized endpoints for large datasets.
*   **Security**:
    *   **JWT Authentication**: Stateless, secure access.
    *   **RBAC**: Role-Based Access Control (Admin vs Employee).
*   **Database**:
    *   **Migrations**: Versioned schema changes via TypeORM.
    *   **Indexing**: Optimized for query performance.

---

## 🛠️ Tech Stack

*   **Framework**: [NestJS](https://nestjs.com/)
*   **Database**: MySQL 8.0 (via TypeORM)
*   **Queue**: RabbitMQ (with Management Plugin)
*   **Cache**: Redis (via ioredis)
*   **Testing**: Jest
*   **Containerization**: Docker & Docker Compose

---

## 📋 Prerequisites

*   Node.js (>= 16)
*   Docker & Docker Compose

---

## ⚡ Getting Started

### 1. Clone & Install
```bash
git clone <repo-url>
cd snap_net_tk
npm install
```

### 2. Configure Environment
A default `.env.sample` is provided. Ensure it matches your local setup:

### 3. Start Infrastructure (Docker)
We use Docker Compose to spin up MySQL, RabbitMQ, and Redis.
```bash
docker-compose up -d
```
*   **MySQL**: Port `3307`
*   **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (User: `user`, Pass: `password`)
*   **Redis**: Port `6379`

**Important**: Once RabbitMQ is up, you may need to ensure the queues exist. The app will create `leave_requests_queue` automatically. Ideally, check the config if you need to manually create `leave_requests_dlq`.

### 4. Run Migrations
Initialize the database schema:
```bash
npm run migrate:up
```

### 5. Start the Application
```bash
# Development
npm run start:dev
```
The server will start on `http://localhost:3000`.

---

## 🧪 Running Tests
We have comprehensive unit tests covering Services, Controllers, and Consumers.
```bash
npm test
```

---

## 🔌 API Usage Examples

### 1. Authentication (Login)
*   **Defaults**: When you create an employee via code, the password is hashed.
*   **Endpoint**: `POST /auth/login`
```bash
previous created user email and password
```

### 2. Create Leave Request (Async)
*   **Endpoint**: `POST /leave-requests`
*   **Header**: `Authorization: Bearer <token>`
```json
{
  "employeeId": "uuid-here",
  "startDate": "2025-01-01",
  "endDate": "2025-01-02",
  "reason": "Sick leave"
}
```
*   **Result**: Returns `201 Created` immediately. The status will update to `APPROVED` (if <= 2 days) or `PENDING_APPROVAL` asynchronously via the worker.

### 3. Health Check
*   **Endpoint**: `GET /health`
*   Returns status of DB, Redis, and RabbitMQ connections.

---

## 📐 Project Structure

*   `src/modules/`: Feature modules (Auth, Employee, Department, LeaveRequest).
*   `src/queue/`: RabbitMQ consumer implementation.
*   `src/database/entities/`: TypeORM entities.
*   `src/database/migrations/`: Database schema versioning.
*   `src/common/`: Shared guards, strategies, and decorators.
