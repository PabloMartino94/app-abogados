# AboxApp

## Overview

AboxApp is a mobile-first web application designed for law firms and attorneys in Spanish-speaking markets. It provides case management, client tracking, court scheduling, document templates, file management, and notification settings — all wrapped in a professional, sober UI optimized for phone screens with a bottom navigation bar.

The app follows a multi-tenant architecture where each law firm (account) has its own isolated data. Users belong to an account and have roles (Abogado/Asistente). The interface is entirely in Spanish.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript (no RSC/SSR — pure client-side SPA)
- **Routing**: Wouter (lightweight alternative to React Router), with all authenticated routes under `/app/*` and public routes at `/`, `/login`, `/crear-cuenta`
- **State Management**: TanStack React Query for server state; a custom `useStore()` hook (via React Context in `client/src/lib/api.tsx`) that aggregates all query data and mutation functions into a single store-like API
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite` plugin), with CSS custom properties for theming. The design uses a custom "app-gradient" background, rounded cards, and soft shadows
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives. Components live in `client/src/components/ui/`. All UI components use the `@/` path alias which resolves to `client/src/`
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **Authentication flow**: Custom context-based auth (`client/src/lib/auth.tsx`) that checks `/api/auth/me` on load, with `RequireAuth` wrapper component for protected routes
- **Mobile-first design**: Bottom navigation bar, FAB (floating action button) for creating entities, responsive layout

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript, compiled with tsx (dev) and esbuild (production)
- **API pattern**: RESTful JSON API under `/api/*` prefix. Key route groups:
  - `/api/auth/*` — signup, login, logout, session check
  - `/api/clients` — CRUD for clients
  - `/api/cases` — CRUD for cases/expedientes
  - `/api/events` — CRUD for calendar events
  - `/api/files` — file management
  - `/api/doc-templates`, `/api/email-templates` — template management
  - `/api/notification-settings` — notification preferences
- **Session management**: Express sessions stored in PostgreSQL via `connect-pg-simple`. Sessions use cookies (httpOnly, 30-day max age)
- **Password hashing**: bcryptjs
- **Multi-tenancy**: Every data query is scoped by `accountId` from the session. The `requireAuth` middleware enforces authentication on protected routes

### Database
- **Database**: PostgreSQL (required, referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for automatic Zod schema generation
- **Schema location**: `shared/schema.ts` — shared between client and server
- **Key tables**:
  - `accounts` — law firms (multi-tenant root)
  - `users` — attorneys/assistants belonging to an account
  - `clients` — client records with contact info, notes, blacklist flag, createdBy (userId)
  - `cases` — legal cases with status (Iniciado/En trámite/Audiencia/Sentencia/Finalizado), fuero, court info, createdBy (userId)
  - `events` — calendar events (Audiencia/Vencimiento/Reunión) linked to cases and clients, createdBy (userId), cancelled flag
  - `files` — uploaded document metadata
  - `doc_templates` / `email_templates` — reusable document and email templates
  - `notification_settings` — per-account notification preferences
- **Migrations**: Use `drizzle-kit push` (`npm run db:push`) to sync schema to database. Migration files output to `./migrations`
- **IDs**: UUIDs generated via PostgreSQL's `gen_random_uuid()`

### Build & Dev
- **Dev mode**: `npm run dev` runs the Express server with tsx, which sets up Vite middleware for HMR (dev server on port 5000)
- **Production build**: `npm run build` runs a custom build script (`script/build.ts`) that builds the Vite client and bundles the server with esbuild into `dist/index.cjs`
- **Vite config**: Client root is `client/`, build output goes to `dist/public/`. Path aliases: `@/` → `client/src/`, `@shared` → `shared/`, `@assets` → `attached_assets/`

### Key Design Decisions
1. **Shared schema between client and server**: The `shared/` directory contains the Drizzle schema and Zod validators, ensuring type safety across the full stack
2. **Session-based auth over JWT**: Simpler implementation, sessions stored in PostgreSQL for persistence across restarts
3. **Multi-tenant by accountId**: All storage methods require accountId scoping, preventing data leakage between law firms
4. **Mobile-first with bottom navigation**: The app shell (`AppShell`) provides consistent layout with a 5-tab bottom nav bar (Dashboard, Clients, Cases, Agenda, Settings)
5. **Clients list**: Desktop shows table layout with all columns (name, doc, email, phone, address, cases count); mobile shows name only with expandable rows
6. **CRUD with attribution**: All entities (clients, cases, events) track which user created them (createdBy). PUT endpoints allow editing. Events can be cancelled/annulled
7. **Detail pages use real data**: Client and case detail pages fetch real data from store, with edit/save/cancel functionality
8. **Search**: Client search filters across all properties (name, doc, email, phone, address, notes)

## External Dependencies

- **PostgreSQL**: Primary database, required. Connection via `DATABASE_URL` environment variable. Used for both application data and session storage
- **Google Fonts**: DM Sans (sans-serif) and Libre Baskerville (serif) loaded from fonts.googleapis.com
- **No payment system**: Explicitly excluded from requirements
- **No external AI/email services currently active**: Build script references OpenAI, Nodemailer, and Google Generative AI as potential bundled dependencies, but they are not actively used in the current codebase