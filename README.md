<div align="center">

  # 🏡 GharSaathi (घर साथी)
  ### *Premium Mobile Household Staff Attendance & Financial Ledger App*

  [![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

  ---

  <p align="center">
    <b>GharSaathi</b> is a native-quality, mobile-first Progressive Web Application (PWA) designed to seamlessly manage household staff attendance, calculate accurate monthly salaries, track consumption-based services, and streamline household payouts with financial-grade precision.
  </p>

</div>

---

## ✨ Key Features

### 📱 **Native Mobile-First Experience**
- **iOS & Android Ergonomics**: Designed strictly for mobile viewports (~430px) with touch-first controls.
- **Glassmorphism Navigation**: Floating bottom tab bar with dynamic glowing active indicators.
- **BottomSheet Action Sheets**: Fluid, slide-up modal sheets (`animate-sheet-up`) replacing web dialogs.
- **Forest Design Token System**: Deep forest palette (`#183C32`), sleek card gradients, and ambient depth shadows (`shadow-card-glow`).

---

### 💰 **Multi-Role Financial Billing Engine**
GharSaathi supports role-specific billing models tailored to authentic Indian household management:

| Household Role | Supported Billing Model | Calculation Formula |
| :--- | :--- | :--- |
| **Cook / Maid / Driver** | **Fixed Monthly Salary** | `Base Salary - (Absent Days × Daily Rate)` *(Auto / Manual Mode)* |
| **Newspaper** | **Cost Per Day** | `Cost Per Day × Present Days` |
| **Milkman** | **Daily Consumption** | `(Litres Per Day × Cost Per Litre) × Present Days` |
| **Ironing** | **Per-Unit / Piece Log** | `Sum of Logged Cloth Drop-off Entries` |
| **Custom Roles (Gardener, etc.)** | **Flexible Basis** | *Choose between Fixed Monthly Schedule or Per-Visit Logging* |

---

### 📅 **Attendance & Vacation Proration**
- **One-Tap Quick Attendance**: Instantly toggle `Present`, `Absent`, or `Half-Day` status for active staff.
- **Vacation Mode Scheduling**: Schedule future leave periods with automated pro-rated salary adjustments.
- **Calendar History**: View daily breakdown and attendance history for any previous month.

---

### 💳 **Financial Payouts & Ledger**
- **Live Wallet Hero Card**: Real-time summary of `Total Base`, `Total Deductions`, and `Net Payable`.
- **Itemized Staff Ledger**: Breakdown of base pay, absence penalties, bonuses, and advances.
- **Payment Lifecycle Tracking**: One-tap `Mark as Paid` status with date and transaction auditing.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase Postgres](https://supabase.com/) with Row Level Security (RLS)
- **Styling**: Vanilla CSS Modules + [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PWA Runtime**: Service Worker + Manifest configuration for home screen installation.

---

## 📁 Repository Structure

```text
GharSaathi/
├── public/
│   ├── manifest.json       # PWA Application Manifest
│   ├── sw.js               # Service Worker Caching Logic
│   └── icons/              # PWA App Launch Icons
├── src/
│   ├── app/
│   │   ├── dashboard/      # Wallet Summary & Quick Attendance View
│   │   ├── helpers/        # Household Staff Management & Detail Views
│   │   ├── history/        # Historical Attendance & Monthly Records
│   │   ├── payments/       # Payout Ledgers & Settlement Actions
│   │   ├── landing/        # Interactive Product Presentation Page
│   │   ├── login/          # Secure Authentication & One-Click Demo Access
│   │   ├── globals.css     # Design Tokens, Glassmorphism & Animations
│   │   └── layout.tsx      # Root Mobile Shell Container
│   ├── components/
│   │   ├── Navigation.tsx  # Fixed Mobile Glass Bottom & Top Bars
│   │   └── PwaRegister.tsx # Service Worker Registration Component
│   ├── context/
│   │   └── AuthContext.tsx # Supabase Authentication Provider
│   └── lib/
│       ├── supabase/       # Browser Supabase Client Client Factory
│       ├── types.ts        # TypeScript Models & Database Interfaces
│       └── utils/          # Validation, Salary Calculations & Sanitization
└── PROJECT_DOCUMENTATION.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm** / **yarn** / **pnpm**
- **Supabase Account**: A free Supabase project for Auth & Postgres DB

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Kuldeepbishnoi2005/GharSaathi-System.git
cd GharSaathi-System
```

---

### 2️⃣ Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### 3️⃣ Install Dependencies & Start Server
```bash
# Install node packages
npm install

# Launch development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your desktop or mobile device.

---

### 4️⃣ Build for Production
```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 🔒 Security & Input Validation

- **Strict Schema Validation**: Inputs are validated against explicit schemas (regex, type coercion, boundaries) prior to database submission.
- **Sanitized Error Messaging**: Client errors are masked to hide internal file paths and raw database errors.
- **Row Level Security (RLS)**: Users can only query and mutate their own household records.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br />
  <sub>Built with ❤️ for Effortless Household Management</sub>
</div>
