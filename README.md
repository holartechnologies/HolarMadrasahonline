# Holartech MadrasahPro Version 1 — Multi-Tenant

Islamic school management system built with Next.js 16, Prisma (PostgreSQL/Supabase), and NextAuth.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL via Supabase (Prisma ORM)
- **Auth:** NextAuth v5 (Credentials provider)
- **UI:** Tailwind CSS v4, shadcn/ui, Radix UI
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Charts:** Recharts

## Multi-Tenant Architecture

Each madrasah (organization) gets its own isolated data within a single database. Tenants are identified by subdomain:

- `demo.yourapp.com` → demo madrasah
- `al-furqan.yourapp.com` → Al-Furqan madrasah

## Quick Start

See [SETUP.md](SETUP.md) for detailed setup instructions.

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

## Environment Variables

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret-key"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Default Credentials

| Role         | Username        | Password     |
|--------------|-----------------|--------------|
| Super Admin  | `admin`         | `admin123`   |
| Mudeer       | `mudeer`        | `mudeer123`  |
| Teacher      | `abdullah_demo` | `teacher123` |
| Teacher      | `aisha_demo`    | `teacher123` |

## Available Scripts

| Command               | Description          |
|-----------------------|----------------------|
| `npm run dev`         | Start dev server     |
| `npm run build`       | Production build     |
| `npm run start`       | Start production     |
| `npm run lint`        | Run ESLint           |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push`     | Push schema to DB    |
| `npm run db:seed`     | Seed database        |
