# Multi-Tenant Setup Guide

## 1. Supabase Setup

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Go to Project Settings → Database → Connection string
4. Copy the connection string (postgresql://...)
5. Paste it into `.env.local` as `DATABASE_URL`

## 2. Push Schema

```bash
npx prisma generate
npx prisma db push
```

## 3. Seed Data

```bash
npx prisma db seed
```

This creates two sample tenants:
- **demo** (slug: `demo`)
- **Al-Furqan** (slug: `al-furqan`)

## 4. Run Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000/login` and log in with any tenant's credentials.

## 5. Vercel Deployment

1. Push code to GitHub
2. Import repo to Vercel
3. Set environment variables:
   - `DATABASE_URL` = your Supabase connection string
   - `AUTH_SECRET` = a random string
   - `AUTH_TRUST_HOST` = `true`
4. Deploy

### Custom Domains (per tenant)

In your Vercel dashboard, add a wildcard domain (`*.yourdomain.com`).

Tenants will be accessible at:
- `demo.yourdomain.com`
- `al-furqan.yourdomain.com`

## Default Credentials

| Tenant  | Role         | Username           | Password     |
|---------|--------------|--------------------|--------------|
| demo    | Super Admin  | `admin`            | `admin123`   |
| demo    | Mudeer       | `mudeer`           | `mudeer123`  |
| demo    | Teacher      | `abdullah_demo`    | `teacher123` |
| demo    | Teacher      | `aisha_demo`       | `teacher123` |
| al-furqan | Super Admin | `admin`            | `admin123`   |
| al-furqan | Mudeer    | `mudeer`           | `mudeer123`  |
| al-furqan | Teacher  | `abdullah_al-furqan` | `teacher123` |
| al-furqan | Teacher  | `aisha_al-furqan`    | `teacher123` |
