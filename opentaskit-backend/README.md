# OpenTaskit Backend API

<p align="center">
  <strong>High-performance REST API and database service for OpenTaskit.</strong><br>
  Built with NestJS, TypeScript, Prisma ORM, and PostgreSQL.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Passport_JWT-Supported-brightgreen?style=flat-square" alt="JWT Auth" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="Proprietary License" />
</p>

---

## Overview

The OpenTaskit Backend provides the central RESTful API, authentication layer, business logic, and database operations powering both the **OpenTaskit Mobile App** and the **Admin Dashboard**.

---

## Core Features

- **Authentication & Security**:
  - JWT authentication with dual access and refresh token rotation.
  - Password hashing using bcrypt.
  - Secure password reset flow using time-limited OTP tokens delivered via SMTP email.
  - Role-Based Access Control (`USER`, `ADMIN`, `PROVIDER`).
- **Task Management**:
  - Full task lifecycle (`OPEN`, `ASSIGNED`, `COMPLETED`, `CANCELLED`).
  - Budget types (`TOTAL` fixed price or `HOURLY` rates).
  - Location modes (`IN_PERSON` with coordinates & address, or `ONLINE` remote).
  - Multi-image attachments and category association.
- **Category System**:
  - Hierarchical categories with unique slugs, icons, and active status toggles.
- **Database & Migrations**:
  - Fully typed schema with Prisma ORM and PostgreSQL.
  - Automated seeding for default admin credentials and marketplace categories.

---

## Project Structure

```text
opentaskit-backend/
├── prisma/
│   ├── schema.prisma        # Database schema definitions and relations
│   ├── seed.ts              # Database seeder (Admin account, categories)
│   └── migrations/          # SQL migration history
├── src/
│   ├── auth/                # Auth controller, service, JWT & refresh strategies, guards
│   ├── categories/          # Category CRUD endpoints and management
│   ├── mail/                # Nodemailer service for transactional emails and OTPs
│   ├── prisma/              # PrismaService and PrismaModule database injection
│   ├── common/              # Decorators, filters, interceptors, and DTOs
│   ├── app.module.ts        # Root module importing feature modules
│   └── main.ts              # Application bootstrap, validation pipes, CORS
├── test/                    # Unit and End-to-End (E2E) test suites
├── .env.example             # Environment variable template
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- Node.js (v18.x or higher)
- PostgreSQL database instance (local or hosted)
- npm or yarn

### 1. Installation

```bash
cd opentaskit-backend
npm install
```

### 2. Environment Configuration

Copy the example environment template and configure your database and secrets:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/opentaskit?schema=public` |
| `JWT_ACCESS_SECRET` | Secret key for signing short-lived access tokens | `your-access-secret-key` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | `your-refresh-secret-key` |
| `SMTP_HOST` | Transactional email SMTP host | `smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP port | `2525` |
| `SMTP_USER` | SMTP username | `your-smtp-user` |
| `SMTP_PASS` | SMTP password | `your-smtp-password` |
| `ADMIN_EMAIL` | Default admin email created on seed | `admin@opentaskit.com` |
| `ADMIN_PASSWORD` | Default admin password created on seed | `AdminPassword123!` |

---

### 3. Database Migration & Seeding

Run Prisma migrations to initialize the database schema, then seed default data:

```bash
# Apply migrations to database
npx prisma migrate dev --name init

# Seed default admin and categories
npx prisma db seed
```

To visually explore and manage database records:

```bash
npx prisma studio
```

---

### 4. Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Debug mode
npm run start:debug

# Production build and run
npm run build
npm run start:prod
```

The API server will listen on `http://localhost:3000`.

---

## API Endpoints Overview

### Authentication (`/auth`)
- `POST /auth/register` - Create a new user account
- `POST /auth/login` - Authenticate and receive access + refresh tokens
- `POST /auth/refresh` - Rotate access token using valid refresh token
- `POST /auth/logout` - Invalidate current session and clear refresh token
- `POST /auth/forgot-password` - Send password reset OTP to email
- `POST /auth/reset-password` - Verify OTP and update password

### Categories (`/categories`)
- `GET /categories` - List all active categories
- `GET /categories/:id` - Get single category details
- `POST /categories` - Create category (Admin only)
- `PATCH /categories/:id` - Update category (Admin only)
- `DELETE /categories/:id` - Delete category (Admin only)

---

## Testing

```bash
# Unit tests
npm run test

# End-to-end (E2E) tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## License

This software and associated documentation files are proprietary and confidential. All rights reserved.
