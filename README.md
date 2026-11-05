# TeamHub HRMS - Human Resource Management System

A modern, production-ready full-stack application for managing human resources. TeamHub HRMS provides a comprehensive suite of tools for handling employee data, attendance, payroll, leave management, shift scheduling, and more.

## 🚀 Tech Stack

### Frontend (`hrms-project-v1`)
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI Library:** React, [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Mobile Support:** [Capacitor](https://capacitorjs.com/) (Android)

### Backend (`hrms-backend-v1`)
- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Security:** Helmet, Throttler (Rate Limiting), Joi (Env Validation)
- **Observability:** `nestjs-pino` (Structured Logging), [Sentry](https://sentry.io/) (Error Tracking)

---

## 🌟 Key Features

- **Employee Management:** Complete CRUD for employee records and organizational structure.
- **Attendance & Leave Tracking:** Track daily attendance, clock-ins, clock-outs, and manage employee leave requests.
- **Shift Scheduling & Swapping:** Dynamic shift assignments and a robust engine for employees to request and approve shift swaps.
- **Payroll Processing:** Automated payroll calculations based on attendance and salary bands.
- **Document Management:** Secure upload and storage of employee documents using AWS S3.
- **Announcements & Tasks:** Company-wide announcements and individual task assignments.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn
- Docker & Docker Compose (for easy database setup)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd hrms-backend-v1
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Copy `.env.example` to `.env` (or create one) and ensure you fill in `DATABASE_URL`, `JWT_SECRET`, and `SENTRY_DSN`.

4. Start the database (using Docker Compose from the root):
   ```bash
   cd ..
   docker-compose up -d db
   cd hrms-backend-v1
   ```


5. Run database migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. Start the development server:
   ```bash
   npm run start:dev
   ```
   The backend will be running at `http://localhost:5000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd hrms-project-v1
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file and configure your API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

---

## 📦 Deployment (Production Readiness)

This repository includes a multi-stage `Dockerfile` and `docker-compose.yml` for deploying the backend to production.
The CI/CD pipeline is configured via GitHub Actions (`.github/workflows/ci.yml`) to automatically lint and test code on pull requests.

For the frontend, it is heavily optimized for deployment on [Vercel](https://vercel.com).

## 🔒 Security & Monitoring
- Ensure `SENTRY_DSN` is correctly configured in production for real-time error alerts.
- Structured JSON logging is enabled in production (via Pino) for easy aggregation.
- The NestJS backend is protected with `helmet` and strict CORS policies.
