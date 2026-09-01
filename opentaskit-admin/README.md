# OpenTaskit Admin Portal

<p align="center">
  <img src="./public/brand/icon-brand.png" alt="OpenTaskit Logo" width="100" height="100" style="border-radius: 24px;" />
</p>

<p align="center">
  <strong>Operations, Financial Escrow Oversight, and Trust & Safety Dashboard.</strong><br>
  The central management dashboard for the OpenTaskit peer-to-peer service marketplace.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Framework-Next.js_16_App_Router-black?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/UI_Library-shadcn%2Fui_%2B_Radix-black?style=flat-square" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Charts-Recharts-0094F7?style=flat-square" alt="Recharts" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## Dashboard Preview

<p align="center">
  <img src="./public/dashboard_screenshot.png" width="95%" alt="OpenTaskit Admin Portal Dashboard" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</p>

---

## Core Modules & Features

| Module | Route | Key Capabilities |
| :--- | :--- | :--- |
| **Executive Overview** | `/` | 4 primary financial/task KPIs, interactive Escrow GMV & Commission charts, category breakdown, urgent Action Required queue, and recent task activity. |
| **Marketplace Analytics** | `/analytics` | Gross Marketplace Volume (GMV), net 10% platform revenue, task completion rate (94.8%), time-to-first-offer (14 mins), category demand share, and regional hubs. |
| **Task Moderation** | `/tasks` | Real-time task inspection, multi-image evidence viewer, status filtering (`OPEN`, `ASSIGNED`, `COMPLETED`, `CANCELLED`), and cancellation controls. |
| **Category Management** | `/categories` | Dynamic category taxonomy CRUD, auto-slug generator, Lucide icon binding, active task counters, and status toggles. |
| **Reviews & Moderation** | `/reviews` | Star-rating filters, rating distributions, and one-click Hide/Publish toggle for defamatory or retaliatory reviews. |
| **User Directory** | `/users` | Filterable user directory by role (`POSTER`, `PROVIDER`, `DUAL`), verification status, rating, and suspension toggling. |
| **User Profile Detail** | `/users/[id]` | Tabbed inspector reviewing profile metadata, submitted National ID (NIC) photos, task history, and wallet financial ledger. |
| **KYC Identity Queue** | `/kyc` | National ID side-by-side front/back inspection, one-click verification approval, and rejection with preset feedback reasons. |
| **Disputes & Arbitration** | `/disputes` | Contested task review, evidence photo audit, and strict 2-way settlement resolution (**100% Refund to Poster** or **100% Release to Provider**). |
| **Escrow & Ledger** | `/finance/escrow` | Active escrow vault overview, released earnings, gateway transaction logs (PayHere, Stripe, Online Card), and net commission tracking. |
| **Live Support Chat** | `/support/chat` | Real-time dual-pane customer support desk with mobile app users, canned quick responses, user context card, and resolve actions. |
| **Problem Reports** | `/support` | Problem tickets submitted via mobile `report-problem.tsx`, screenshot inspector, and admin resolution note dispatch. |
| **Legal & Policy CMS** | `/legal` | Structured section editor for Terms of Service and Privacy Policy with automated semantic version bumping (`v1.2.0` -> `v1.2.1`) and real-time mobile preview. |
| **Global Settings** | `/settings` | Platform commission take-rate (10%), minimum task budget (LKR 1,000), escrow auto-release window (3 days), and helpline contacts. |

---

## Technical Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Component System**: shadcn/ui (Radix UI primitives)
- **Visualizations**: Recharts with theme-aware `ChartContainer` and tooltip components
- **Styling**: Tailwind CSS v4, OKLCH high-contrast color tokens
- **Icons**: Lucide React
- **Theme Support**: Next Themes (Dark / Light mode persistent toggle)

---

## Directory Structure

```text
opentaskit-admin/
├── public/
│   ├── brand/
│   │   └── icon-brand.png        # Official OpenTaskit brand emblem
│   └── dashboard_screenshot.png  # Portal dashboard capture
│
├── src/
│   ├── app/
│   │   ├── analytics/            # Performance KPIs and growth charts
│   │   ├── categories/           # Category taxonomy management
│   │   ├── disputes/             # Escrow dispute resolution
│   │   ├── finance/
│   │   │   └── escrow/           # Escrow vault and gateway ledger
│   │   ├── kyc/                  # National ID verification queue
│   │   ├── legal/                # Legal & Policy CMS with auto-versioning
│   │   ├── reviews/              # Review & rating moderation
│   │   ├── settings/             # Platform fees & support channels
│   │   ├── support/              # Problem reports inbox
│   │   │   └── chat/             # Live support desk
│   │   ├── tasks/                # Marketplace task inspection
│   │   ├── users/                # User management & profile inspector
│   │   ├── globals.css           # OKLCH color tokens and theme styles
│   │   ├── layout.tsx            # Root layout with sidebar and theme provider
│   │   └── page.tsx              # Executive overview dashboard
│   │
│   ├── components/
│   │   ├── layout/               # AppSidebar and AppHeader
│   │   ├── ui/                   # shadcn/ui components (chart, card, table, etc.)
│   │   ├── theme-provider.tsx    # Theme provider wrapper
│   │   └── theme-toggle.tsx      # Light/Dark mode switcher
│   │
│   ├── data/
│   │   └── mock-data.ts          # Strongly-typed schemas and mock datasets
│   │
│   └── lib/
│       └── utils.ts              # cn() Tailwind class merger utility
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18.x or v20.x recommended)
- npm, yarn, or pnpm

### Installation

1. Navigate to the admin portal directory:
   ```bash
   cd opentaskit-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Quality Assurance

To check TypeScript compilation across all admin routes:

```bash
npx tsc --noEmit
```
