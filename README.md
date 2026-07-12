
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
    *   **Helmet**: Sensible security headers (CSP, HSTS, etc.) on every response.
    *   **Fail-fast config**: The app validates all required env vars on boot (Joi) and refuses to start if anything is missing/malformed.
*   **Database**:
    *   **Migrations**: Versioned schema changes via TypeORM (schema is never auto-synced in any environment).
    *   **Connection pooling**: Configurable pool size (`DB_POOL_SIZE`) so it can be tuned per replica.
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
A default `.env.sample` is provided. Ensure it matches your local setup. All required variables are validated on boot (via Joi) — the app fails fast with a clear error instead of misbehaving at runtime if something is missing.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` \| `test` \| `production` |
| `PORT` | No | `3000` | |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | Yes | — | |
| `DB_POOL_SIZE` | No | `10` | Max MySQL connections **per instance**. Tune down as you add replicas. |
| `RABBITMQ_URI` | Yes | — | |
| `RABBITMQ_PREFETCH_COUNT` | No | `10` | Max unacked messages per consumer instance; controls fair dispatch across worker replicas. |
| `REDIS_URI` | Yes | — | `redis://` or `rediss://` |
| `JWT_SECRET` | Yes | — | Minimum 16 characters. |
| `CORS_ORIGIN` | No | `*` | Lock this down to your real origin(s) in production. |

### 3. Start Infrastructure (Docker)
We use Docker Compose to spin up MySQL, RabbitMQ, **and Redis**.
```bash
npm run docker
# equivalent to: docker compose up -d
```
*   **MySQL**: Port `3307`
*   **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (User: `user`, Pass: `password`)
*   **Redis**: Port `6379`

**Queue topology is created automatically on boot.** On startup, the app declares `leave_requests_queue`, the `leave_requests_dlx` dead-letter exchange, and the `leave_requests_dlq` queue itself (see `src/queue/topology.ts`) — nothing to create by hand.

> **Upgrading an existing deployment?** RabbitMQ doesn't allow redeclaring a queue with different arguments. If `leave_requests_queue` already exists from a version of this app predating the dead-letter setup, boot will fail with `PRECONDITION_FAILED`. One-time fix: delete the old queue (via the management UI or `rabbitmqadmin delete queue name=leave_requests_queue`) and let the app recreate it with the correct arguments.

### 4. Run Migrations
Initialize the database schema (the app never auto-syncs the schema, in any environment — migrations are the only source of truth):
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
*   Returns status of DB, Redis, and RabbitMQ connections. Safe to poll frequently (e.g. k8s liveness/readiness probes) — it reuses the app's existing long-lived Redis/RabbitMQ clients rather than opening a new broker connection per request.

---

## 📈 Scaling & Production Considerations

This app is designed to run as **multiple stateless replicas** behind a load balancer, plus one or more RabbitMQ consumer replicas processing `leave.requested` events. A few things to know when doing that:

*   **Horizontal scaling**: The HTTP API is stateless (JWT auth, no in-memory session state) — just run more instances behind a load balancer. Each instance also runs its own RMQ consumer (`ConsumerModule`), so scaling API replicas also scales queue processing capacity.
*   **RabbitMQ prefetch**: `RABBITMQ_PREFETCH_COUNT` (default 10) bounds how many unacked messages each consumer instance holds at once. This is what makes RabbitMQ's round-robin dispatch actually balance load across replicas — without it, one replica can end up starved while another is flooded.
*   **Dead-letter queue**: Once a message exhausts its retries (exponential backoff, 3 attempts), the consumer `nack`s it and RabbitMQ routes it to `leave_requests_dlq` via the `leave_requests_dlx` exchange, so failed jobs are preserved for inspection/replay instead of being silently dropped.
*   **DB connection pooling**: `DB_POOL_SIZE` (default 10) is a **per-instance** cap. If MySQL's `max_connections` is, say, 150 and you plan to run 10 replicas, keep `DB_POOL_SIZE` around 10-12 per instance so you don't exhaust the DB under peak concurrency.
*   **Redis caching**: Employee lookups are cached for ~1h with jitter (±5 min) so cache entries warmed together (e.g. right after a deploy) don't all expire at the same instant and stampede the DB. The Redis client backs off and logs on connection errors instead of crashing the process, so a transient Redis blip degrades to "cache miss," not downtime.
*   **Graceful shutdown**: `app.enableShutdownHooks()` is enabled, so on `SIGTERM` (rolling deploys, autoscaling scale-down) the app drains in-flight requests and closes DB/Redis/RabbitMQ connections cleanly instead of dropping them mid-request.
*   **Pagination**: All list endpoints cap `limit` at 100 to prevent a client from forcing an unbounded query.

---

## 📐 Project Structure

*   `src/modules/`: Feature modules (Auth, Employee, Department, LeaveRequest).
*   `src/queue/`: RabbitMQ producer/consumer wiring, dead-letter topology (`topology.ts`, `queue.constants.ts`), and the leave-request consumer.
*   `src/database/entities/`: TypeORM entities.
*   `src/database/migrations/`: Database schema versioning.
*   `src/common/`: Shared guards, strategies, decorators, and DTOs.
*   `src/config/`: TypeORM CLI config and env var validation (`env.validation.ts`).
