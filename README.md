# OpenTaskit Monorepo

<p align="center">
  <img src="./opentaskit-app/assets/brand/icon-brand.png" alt="OpenTaskit Logo" width="120" height="120" style="border-radius: 28px;" />
</p>

<p align="center">
  <strong>Local services, done right.</strong><br>
  A peer-to-peer local task marketplace platform containing the mobile application, backend API, and administration dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Monorepo-3_Packages-0094F7?style=flat-square" alt="Monorepo" />
  <img src="https://img.shields.io/badge/Mobile-React_Native_0.86-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Backend-NestJS_11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_%2B_Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Admin-Next.js_15_%2B_shadcn-black?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="Proprietary License" />
</p>

---

## Platform Previews

### Mobile App Experience
<p align="center">
  <img src="./opentaskit-app/screenshots/1.png" width="23%" alt="Screenshot 1" />
  <img src="./opentaskit-app/screenshots/2.png" width="23%" alt="Screenshot 2" />
  <img src="./opentaskit-app/screenshots/3.png" width="23%" alt="Screenshot 3" />
  <img src="./opentaskit-app/screenshots/4.png" width="23%" alt="Screenshot 4" />
</p>

### Admin Management Dashboard
<p align="center">
  <img src="./opentaskit-admin/public/dashboard_screenshot.png" width="95%" alt="OpenTaskit Admin Dashboard" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</p>

---

## Monorepo Packages

| Package | Technology Stack | Description | Directory |
| :--- | :--- | :--- | :--- |
| **Mobile App** | React Native 0.86, Expo SDK 57, NativeWind v4, Reanimated v4 | Cross-platform iOS and Android peer-to-peer marketplace app | [`opentaskit-app/`](./opentaskit-app) |
| **Backend API** | NestJS 11, TypeScript, Prisma ORM, PostgreSQL, Passport JWT | Central REST API, authentication, task lifecycle, and database layer | [`opentaskit-backend/`](./opentaskit-backend) |
| **Admin Dashboard** | Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts | Web administration portal for escrow oversight, KYC verification, and disputes | [`opentaskit-admin/`](./opentaskit-admin) |

---

## Architecture and System Overview

```text
opentaskit/
├── opentaskit-app/          # Mobile Application (React Native / Expo)
│   ├── assets/              # Brand vectors, fonts, images
│   ├── screenshots/         # App preview captures
│   ├── src/                 # Screens, components, state slices, navigation
│   ├── app.json             # Expo project configuration
│   └── package.json
│
├── opentaskit-backend/      # REST API & Database Service (NestJS / Prisma)
│   ├── prisma/              # Database schema, migrations, seeders
│   ├── src/                 # Auth, categories, tasks, common utilities
│   ├── .env.example         # Template for environment configuration
│   └── package.json
│
├── opentaskit-admin/        # Administration Dashboard (Next.js / shadcn/ui)
│   ├── src/app/             # Next.js App Router admin pages
│   ├── src/components/ui/   # shadcn/ui Radix component library
│   └── package.json
│
├── .gitignore               # Unified monorepo security and ignore rules
├── LICENSE                  # Commercial proprietary license
└── README.md                # Central documentation
```

---

## Getting Started

### Prerequisites

- Node.js (v18.x or v20.x recommended)
- npm or yarn
- PostgreSQL database instance (local or hosted, e.g. Neon, Supabase, Railway)
- Android Studio / Android SDK (for mobile Android build) or Xcode (for iOS build)

---

### 1. Mobile App Setup (`opentaskit-app`)

```bash
cd opentaskit-app
npm install

# Verify project health
npx expo-doctor --verbose

# Run clean native prebuild
npx expo prebuild --clean

# Launch on connected device or emulator
npx expo run:android --device
# or
npx expo run:ios --device
```

For detailed mobile app documentation, see [`opentaskit-app/README.md`](./opentaskit-app/README.md).

---

### 2. Backend Setup (`opentaskit-backend`)

```bash
cd opentaskit-backend
npm install

# Configure environment variables
cp .env.example .env

# Generate Prisma client & apply database migrations
npx prisma migrate dev --name init
npx prisma db seed

# Start development server
npm run start:dev
```

Backend API will be running at `http://localhost:3000`. For detailed backend documentation, see [`opentaskit-backend/README.md`](./opentaskit-backend/README.md).

---

### 3. Admin Dashboard Setup (`opentaskit-admin`)

```bash
cd opentaskit-admin
npm install

# Start development server
npm run dev
```

Admin dashboard will be available at `http://localhost:3001` (or next available port).

---

## License

This software and associated documentation files are proprietary and confidential. All rights reserved. See [LICENSE](LICENSE) for details.
