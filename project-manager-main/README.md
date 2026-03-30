# 🚀 Catalyst - Project Management Accelerator

**Catalyst** is an enterprise-grade backend for project management systems, designed for high performance, scalability, and developer experience. It provides a robust foundation for building collaborative tools with real-time updates, resilient background processing, and enterprise security.

---

## 🛠️ Tech Stack

### Core
*   **Node.js & Express**: High-performance backend routing and middleware.
*   **MongoDB & Mongoose**: Flexible, schema-driven data persistence.
*   **Socket.io**: Bi-directional, real-time communication for chat and activity logs.

### Infrastructure & Performance
*   **Redis**: High-speed, in-memory data store for caching, rate limiting, and token management.
*   **BullMQ**: Professional-grade task queue for asynchronous background jobs.
*   **Winston**: Centralized, structured logging with daily file rotation.

### Integration
*   **Resend**: Reliable transactional email delivery.
*   **Cloudinary**: Seamless cloud-based media storage and management.

---

## ✨ Key Features

### 🔐 Authentication & Security
*   **JWT & Refresh Tokens**: Secure session management.
*   **RBAC (Role-Based Access Control)**: Fine-grained permissions (Admin, Member, Viewer).
*   **Redis Blacklist**: Instant, O(1) token revocation.
*   **Enterprise Middleware**: Helmet, CORS, XSS filtering, and NoSQL injection protection.
*   **Distributed Rate Limiting**: Scalable protection against brute force and DDoS using Redis.

### 📬 Resilient Background Jobs (BullMQ)
*   **Email Queue**: Non-blocking delivery with automatic retries and exponential backoff.
*   **Maintenance Queue**: Automated system cleanup (stale invitations, expired tokens).
*   **Cron Replacement**: Persistent repeatable jobs that survive server restarts.

### 💬 Real-time Collaboration
*   **Instant Updates**: Real-time project activity and workspace notifications.
*   **Active Presence**: Track who is online and where they are working.

### 📂 File Management
*   **Cloudinary Integration**: Direct-to-cloud uploads for task attachments and project assets.

### 📊 Advanced Observability
*   **Winston Logging**: Rotating logs (`combined-*.log`, `error-*.log`) with historical tracking.
*   **Morgan Integration**: Streams HTTP logs through the centralized logging system.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Atlas or Local)
*   Redis (v6+) — *Running via Docker is recommended*

### Environment Configuration
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
COOKIE_SECRET=your_cookie_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
RESEND_API_KEY=your_resend_key
FROM_EMAIL=Onboarding <onboarding@resend.dev>

# Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation & Run

1.  **Clone & Install Dependencies**
    ```bash
    cd project-manager-main/backend
    npm install
    ```

2.  **Start Redis (via Docker)**
    ```bash
    docker run -d --name redis -p 6379:6379 redis:alpine
    ```

3.  **Seed Database (Optional)**
    ```bash
    npm run seed
    ```

4.  **Start Development Server**
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

```text
backend/
├── adapters/          # External integrations (Email, Storage)
├── db/                # Database configuration
├── error-handlers/    # Global error management
├── middleware/        # Security, Auth, Rate-limiting
├── modules/           # Business logic (Auth, Project, Task, Chat)
├── seeders/           # Initial data population
├── services/          # Core utilities (Redis, Queue, Cron, Logger)
└── workers/           # Background process handlers (BullMQ)
```

---

## 📜 API Documentation
Access the API root at `http://localhost:5000/` for an overview of available endpoints.

---

## 👨‍💻 Contributing
We welcome contributions to make Catalyst even better! Feel free to open issues or submit pull requests.

---

