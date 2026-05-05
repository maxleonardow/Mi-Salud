# Plan 1 — Foundation & Shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deployed Next.js PWA where the user can log in with magic link and see an empty shell with sidebar (desktop) / bottom nav (mobile). No business logic yet — just foundation.

**Architecture:** Next.js 15 App Router + TypeScript + Tailwind 4 + shadcn/ui, Supabase (Postgres + Auth) with RLS, deployed on Vercel. Service worker via serwist for PWA install + offline shell. Single `profiles` table seeded on first auth.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind 4, shadcn/ui, Supabase (`@supabase/supabase-js` + `@supabase/ssr`), TanStack Query 5, serwist, lucide-react (icons), Vitest + Playwright (testing), pnpm.

**Spec reference:** `docs/superpowers/specs/2026-05-04-health-app-design.md` sections 3-5, 7 (profiles only), 8, 9, 12.

---

## File Structure (created in this plan)

```
health-app/
├── package.json                          # deps + scripts
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts                        # withSerwist wrapper
├── tailwind.config.ts                    # tailwind v4 config
├── postcss.config.mjs
├── components.json                       # shadcn config
├── .env.example                          # env template
├── .env.local                            # gitignored, local dev
├── middleware.ts                         # session refresh + auth gate
│
├── src/
│   ├── app/
│   │   ├── globals.css                   # tailwind + theme tokens
│   │   ├── layout.tsx                    # root layout (HTML, providers)
│   │   ├── manifest.ts                   # PWA manifest
│   │   ├── sw.ts                         # service worker entry
│   │   ├── icon.tsx                      # generated favicon
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                # auth pages layout (no shell)
│   │   │   ├── login/page.tsx            # magic link form
│   │   │   ├── callback/route.ts         # OAuth/magic link callback
│   │   │   └── sign-out/route.ts
│   │   └── (app)/                        # authenticated route group
│   │       ├── layout.tsx                # AppShell (sidebar + bottom nav)
│   │       ├── page.tsx                  # Hoy (placeholder)
│   │       ├── habitos/page.tsx
│   │       ├── suplementos/page.tsx
│   │       ├── comer/page.tsx
│   │       ├── mover/page.tsx
│   │       ├── labs/page.tsx
│   │       └── ajustes/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx               # desktop sidebar
│   │   │   ├── bottom-nav.tsx            # mobile bottom nav
│   │   │   └── module-header.tsx         # title + meta + action
│   │   └── providers.tsx                 # TanStack Query + Toaster
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # browser client
│   │   │   ├── server.ts                 # server client (RSC, route handlers)
│   │   │   └── middleware.ts             # session refresh helper
│   │   ├── nav.ts                        # nav item metadata (shared sidebar/bottom-nav)
│   │   └── utils.ts                      # shadcn cn() helper
│   │
│   └── types/
│       └── database.types.ts             # generated from Supabase
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20260504000000_profiles.sql
│   └── seed.sql
│
└── tests/
    ├── unit/
    │   └── nav.test.ts
    └── e2e/
        ├── auth.spec.ts                  # login flow E2E
        └── playwright.config.ts
```

---

### Task 1: Initialize Next.js project

**Files:**
- Create: `health-app/` (or use existing dir if init in place)

- [ ] **Step 1: Initialize project**

```bash
cd /Users/maximilianoleonardowinkler/Documents/Claude/health-app
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm --no-eslint --no-turbopack
```

When prompted "directory not empty, continue?" → Yes. (Existing files: `.git`, `docs/`, `.gitignore`, `.superpowers/` will be preserved.)

- [ ] **Step 2: Verify dev server runs**

```bash
pnpm dev
```

Open http://localhost:3000 — should show Next.js default page. Stop with Ctrl+C.

- [ ] **Step 3: Update `.gitignore` to keep existing entries**

Read the file Next.js created and merge it with what was there. Ensure these are present:
```
.next/
node_modules/
.env*.local
.superpowers/
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Add core dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add @supabase/supabase-js @supabase/ssr @tanstack/react-query @tanstack/react-query-devtools lucide-react clsx tailwind-merge class-variance-authority sonner zod react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Install dev deps**

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test supabase
```

- [ ] **Step 3: Add scripts to `package.json`**

Edit `package.json` and add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"db:types": "supabase gen types typescript --local > src/types/database.types.ts",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add core deps (supabase, tanstack-query, testing)"
```

---

### Task 3: Setup shadcn/ui

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/*`

- [ ] **Step 1: Initialize shadcn**

```bash
pnpm dlx shadcn@latest init
```

Choose: **Default** style, **Slate** base color, CSS variables = **yes**.

- [ ] **Step 2: Add initial components**

```bash
pnpm dlx shadcn@latest add button card input label dialog sheet form select tabs toast tooltip badge checkbox skeleton
```

- [ ] **Step 3: Verify `src/lib/utils.ts` exists with `cn()` helper**

It should be auto-created. Content should be:
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: setup shadcn/ui with initial components"
```

---

### Task 4: Configure theme tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace `:root` block with spec tokens**

Open `src/app/globals.css` and replace the `:root` and `.dark` blocks (keep the `@tailwind` / `@import` lines intact):

```css
:root {
  --background: 0 0% 100%;          /* #ffffff */
  --foreground: 240 5% 11%;         /* #1a1a1c */

  --surface: 240 10% 98%;           /* #fafafb */
  --surface-alt: 240 9% 97%;        /* #f6f6f8 */

  --border: 240 6% 92%;             /* #e8e8ea */
  --border-strong: 240 6% 94%;      /* #ececef */

  --muted: 240 9% 97%;
  --muted-foreground: 240 4% 45%;   /* #6e6e73 */
  --subtle-foreground: 240 4% 56%;  /* #8e8e93 */

  --accent: 218 100% 50%;           /* #0066ff */
  --accent-foreground: 0 0% 100%;
  --accent-bg: 220 100% 96%;        /* #eef2ff */

  --success: 84 39% 40%;            /* #6b8e3d */
  --warning: 45 51% 48%;            /* #b89a3d */
  --danger: 14 64% 47%;             /* #c4502e */

  --primary: var(--accent);
  --primary-foreground: var(--accent-foreground);

  --card: var(--background);
  --card-foreground: var(--foreground);

  --popover: var(--background);
  --popover-foreground: var(--foreground);

  --secondary: var(--surface-alt);
  --secondary-foreground: var(--foreground);

  --destructive: var(--danger);
  --destructive-foreground: var(--accent-foreground);

  --input: var(--border);
  --ring: var(--accent);

  --radius: 0.625rem;
}
```

- [ ] **Step 2: Add Inter font in root layout**

Edit `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mi Salud",
  description: "Personal health management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify dev server renders with new theme**

```bash
pnpm dev
```

Open http://localhost:3000 — page should render with new font/colors. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add theme tokens and Inter font"
```

---

### Task 5: Setup Supabase project (manual + CLI link)

**Files:**
- Create: `.env.local`, `.env.example`, `supabase/config.toml`

- [ ] **Step 1: Create Supabase project (manual)**

Go to https://supabase.com/dashboard, create a new project named `mi-salud`. Region: closest to user (e.g. `us-east-1` or `mx-central`). Save the database password to a password manager.

Once created, copy from Settings > API:
- `Project URL`
- `anon` public key
- `service_role` secret key (will be needed in Vercel later)

- [ ] **Step 2: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

- [ ] **Step 3: Create `.env.example`**

Same content as `.env.local` but with placeholder values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Initialize Supabase CLI in repo**

```bash
pnpm dlx supabase init
```

When prompted to generate a VS Code config or IntelliJ config, choose **No** unless using one of those.

- [ ] **Step 5: Link to remote project**

```bash
pnpm dlx supabase link --project-ref YOUR_PROJECT_REF
```

Enter the database password when prompted.

- [ ] **Step 6: Commit**

```bash
git add .env.example supabase/
git commit -m "chore: link Supabase project (env template + CLI config)"
```

---

### Task 6: First migration — `profiles` table + RLS

**Files:**
- Create: `supabase/migrations/20260504000000_profiles.sql`, `supabase/seed.sql`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/20260504000000_profiles.sql`:

```sql
-- profiles: per-user metadata, 1:1 with auth.users
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birthdate date,
  units_pref text not null default 'metric' check (units_pref in ('metric','imperial')),
  timezone text not null default 'America/Mexico_City',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- bootstrap profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at auto-set
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();
```

- [ ] **Step 2: Create empty seed file**

Create `supabase/seed.sql`:
```sql
-- Seed data goes here. Empty for now.
```

- [ ] **Step 3: Apply migration to remote**

```bash
pnpm dlx supabase db push
```

Confirm when prompted.

- [ ] **Step 4: Verify in Supabase dashboard**

In dashboard > Table Editor, confirm `public.profiles` table exists with the columns specified.

- [ ] **Step 5: Generate TypeScript types**

```bash
pnpm dlx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.types.ts
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/ supabase/seed.sql src/types/database.types.ts
git commit -m "feat(db): add profiles table with RLS and bootstrap trigger"
```

---

### Task 7: Supabase client helpers

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Browser client** — `src/lib/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Server client** — `src/lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Setting cookies in Server Components is restricted; middleware refreshes them.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Middleware helper** — `src/lib/supabase/middleware.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Routes inside (app) require auth. /login is public.
  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase client helpers (browser, server, middleware)"
```

---

### Task 8: Root middleware (session refresh + auth gate)

**Files:**
- Create: `middleware.ts` (project root, NOT in src/)

- [ ] **Step 1: Create middleware**

Create `middleware.ts` at the project root:

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Verify type check passes**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add root middleware for auth gate"
```

---

### Task 9: Auth — login page (magic link)

**Files:**
- Create: `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/actions.ts`

- [ ] **Step 1: Auth layout** — `src/app/(auth)/layout.tsx`

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex items-center justify-center px-4 bg-[var(--surface)]">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Login server action** — `src/app/(auth)/login/actions.ts`

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email required" };

  const supabase = await createClient();
  const origin = (await headers()).get("origin")!;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 3: Login page UI** — `src/app/(auth)/login/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "./actions";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signInWithEmail(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Revisa tu email</h1>
        <p className="text-sm text-muted-foreground">
          Te mandamos un link para entrar. Ábrelo en este dispositivo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mi Salud</h1>
        <p className="text-sm text-muted-foreground">Entra con tu email — te mandamos un magic link.</p>
      </div>
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Enviando..." : "Mandar magic link"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat(auth): add login page with magic link"
```

---

### Task 10: Auth — callback + sign-out routes

**Files:**
- Create: `src/app/(auth)/callback/route.ts`, `src/app/(auth)/sign-out/route.ts`

- [ ] **Step 1: Callback route** — `src/app/(auth)/callback/route.ts`

Note: route group `(auth)` is invisible in URL — actual path is `/auth/callback` only if we name the folder `auth`. Since we used `(auth)` group, the URL is just `/callback`. To match the redirect URL `/auth/callback` we set in actions, MOVE this file: create `src/app/auth/callback/route.ts` (no parens). Update folder structure accordingly.

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }
  return NextResponse.redirect(`${url.origin}/login?error=auth_failed`);
}
```

Path: `src/app/auth/callback/route.ts`

- [ ] **Step 2: Sign-out route** — `src/app/auth/sign-out/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/login`, { status: 303 });
}
```

Path: `src/app/auth/sign-out/route.ts`

- [ ] **Step 3: Update Supabase Auth redirect URLs**

In Supabase dashboard > Authentication > URL Configuration:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

(We'll add the production URL in Task 16 after deploy.)

- [ ] **Step 4: Commit**

```bash
git add src/app/auth/
git commit -m "feat(auth): add callback and sign-out routes"
```

---

### Task 11: Nav metadata (shared sidebar/bottom-nav)

**Files:**
- Create: `src/lib/nav.ts`, `tests/unit/nav.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/unit/nav.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_GROUPS, getActiveItem } from "@/lib/nav";

describe("nav metadata", () => {
  it("exposes 7 items (Hoy + 5 modules + Ajustes)", () => {
    expect(NAV_ITEMS).toHaveLength(7);
    const slugs = NAV_ITEMS.map(i => i.href);
    expect(slugs).toEqual([
      "/",
      "/habitos",
      "/suplementos",
      "/comer",
      "/mover",
      "/labs",
      "/ajustes",
    ]);
  });

  it("groups items into Hoy / Tracking / Salud / Cuenta", () => {
    expect(NAV_GROUPS.map(g => g.label)).toEqual(["Hoy", "Tracking", "Salud", "Cuenta"]);
  });

  it("returns the matching item for a given pathname", () => {
    expect(getActiveItem("/")?.label).toBe("Hoy");
    expect(getActiveItem("/habitos")?.label).toBe("Hábitos");
    expect(getActiveItem("/habitos/123")?.label).toBe("Hábitos");
    expect(getActiveItem("/desconocido")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Add Vitest config** — `vitest.config.ts` (project root)

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
```

Create empty setup file: `tests/setup.ts`
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL with "cannot find module @/lib/nav".

- [ ] **Step 4: Implement** — `src/lib/nav.ts`

```ts
import {
  Home,
  CheckSquare,
  Pill,
  Utensils,
  Dumbbell,
  FlaskConical,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;     // for bottom nav
  icon: LucideIcon;
  group: "hoy" | "tracking" | "salud" | "cuenta";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/",            label: "Hoy",            shortLabel: "Hoy",     icon: Home,         group: "hoy" },
  { href: "/habitos",     label: "Hábitos",        shortLabel: "Hábitos", icon: CheckSquare,  group: "tracking" },
  { href: "/suplementos", label: "Suplementación", shortLabel: "Sups",    icon: Pill,         group: "tracking" },
  { href: "/comer",       label: "Alimentación",   shortLabel: "Comer",   icon: Utensils,     group: "tracking" },
  { href: "/mover",       label: "Ejercicio",      shortLabel: "Mover",   icon: Dumbbell,     group: "tracking" },
  { href: "/labs",        label: "Biomarcadores",  shortLabel: "Labs",    icon: FlaskConical, group: "salud" },
  { href: "/ajustes",     label: "Ajustes",        shortLabel: "Cuenta",  icon: Settings,     group: "cuenta" },
];

export const NAV_GROUPS = [
  { key: "hoy",      label: "Hoy" },
  { key: "tracking", label: "Tracking" },
  { key: "salud",    label: "Salud" },
  { key: "cuenta",   label: "Cuenta" },
] as const;

export function getActiveItem(pathname: string): NavItem | undefined {
  // exact match for root, prefix for the rest
  if (pathname === "/") return NAV_ITEMS[0];
  return NAV_ITEMS.slice(1).find(item => pathname.startsWith(item.href));
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/nav.ts tests/ vitest.config.ts
git commit -m "feat: add nav metadata with shared groups + active matcher"
```

---

### Task 12: Sidebar component (desktop)

**Files:**
- Create: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NAV_GROUPS, getActiveItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const active = getActiveItem(pathname);

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-[var(--border-strong)] bg-[var(--surface)] px-3 py-4">
      <div className="px-2 py-1 mb-4 flex items-center gap-2 font-bold text-sm tracking-tight">
        <span className="inline-block size-[18px] rounded-md bg-[hsl(var(--accent))]" />
        Mi Salud
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_GROUPS.map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className={group.key === "cuenta" ? "mt-auto" : ""}>
              {group.key !== "hoy" && (
                <div className="px-2 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--subtle-foreground))]">
                  {group.label}
                </div>
              )}
              {items.map(item => {
                const Icon = item.icon;
                const isActive = active?.href === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors",
                      isActive
                        ? "bg-[hsl(var(--accent-bg))] text-[hsl(var(--accent))] font-semibold"
                        : "text-[hsl(var(--foreground))]/85 hover:bg-[hsl(var(--surface-alt))]"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(layout): add desktop sidebar"
```

---

### Task 13: Bottom nav component (mobile)

**Files:**
- Create: `src/components/layout/bottom-nav.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, getActiveItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

// Bottom nav shows 6 tabs: Hoy + 5 modules (skips Ajustes — accessible via "Cuenta" tab elsewhere later)
const BOTTOM_NAV = NAV_ITEMS.filter(i => i.group !== "cuenta");

export function BottomNav() {
  const pathname = usePathname();
  const active = getActiveItem(pathname);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-strong)] bg-[var(--background)] grid grid-cols-6 px-1 py-1.5 gap-0.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {BOTTOM_NAV.map(item => {
        const Icon = item.icon;
        const isActive = active?.href === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium",
              isActive ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--subtle-foreground))]"
            )}
          >
            <Icon className="size-[18px]" />
            <span>{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/bottom-nav.tsx
git commit -m "feat(layout): add mobile bottom nav"
```

---

### Task 14: Module header component

**Files:**
- Create: `src/components/layout/module-header.tsx`

- [ ] **Step 1: Implement**

```tsx
import { type ReactNode } from "react";

type Props = {
  title: string;
  meta?: string;
  action?: ReactNode;
};

export function ModuleHeader({ title, meta, action }: Props) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {meta && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{meta}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/module-header.tsx
git commit -m "feat(layout): add module header component"
```

---

### Task 15: Providers (TanStack Query + Toaster)

**Files:**
- Create: `src/components/providers.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Providers component**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-center" />
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Wire in root layout** — modify `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mi Salud",
  description: "Personal health management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/providers.tsx src/app/layout.tsx
git commit -m "feat: add providers (TanStack Query + Toaster)"
```

---

### Task 16: App shell layout + empty module pages

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/habitos/page.tsx`, `src/app/(app)/suplementos/page.tsx`, `src/app/(app)/comer/page.tsx`, `src/app/(app)/mover/page.tsx`, `src/app/(app)/labs/page.tsx`, `src/app/(app)/ajustes/page.tsx`

- [ ] **Step 1: App shell layout** — `src/app/(app)/layout.tsx`

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex">
      <Sidebar />
      <main className="flex-1 px-5 py-6 md:px-8 md:py-7 pb-24 md:pb-7">{children}</main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Hoy placeholder** — `src/app/(app)/page.tsx`

```tsx
import { ModuleHeader } from "@/components/layout/module-header";

export default function HoyPage() {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });
  return (
    <>
      <ModuleHeader title="Hoy" meta={today} />
      <p className="text-sm text-muted-foreground">Próximamente.</p>
    </>
  );
}
```

- [ ] **Step 3: Other module placeholders**

Create the same file pattern for each, varying title only:

`src/app/(app)/habitos/page.tsx`:
```tsx
import { ModuleHeader } from "@/components/layout/module-header";
export default function Page() {
  return (<><ModuleHeader title="Hábitos" /><p className="text-sm text-muted-foreground">Próximamente.</p></>);
}
```

`src/app/(app)/suplementos/page.tsx`: title `"Suplementación"`
`src/app/(app)/comer/page.tsx`: title `"Alimentación"`
`src/app/(app)/mover/page.tsx`: title `"Ejercicio"`
`src/app/(app)/labs/page.tsx`: title `"Biomarcadores"`
`src/app/(app)/ajustes/page.tsx`: title `"Ajustes"`

(Copy the habitos/page.tsx structure for each, change the title string.)

- [ ] **Step 4: Verify dev server**

```bash
pnpm dev
```

Visit http://localhost:3000 — should redirect to /login. Test login flow with your real email — magic link → callback → dashboard. Click each sidebar item, verify routing works. Resize to mobile width, verify bottom nav appears.

Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/
git commit -m "feat: add app shell layout with empty module pages"
```

---

### Task 17: PWA manifest + icons

**Files:**
- Create: `src/app/manifest.ts`, `public/icon-192.png`, `public/icon-512.png`

- [ ] **Step 1: Manifest** — `src/app/manifest.ts`

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Salud",
    short_name: "Mi Salud",
    description: "Personal health management",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0066ff",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

- [ ] **Step 2: Generate placeholder icons**

Use ImageMagick (if installed) or any image tool. From repo root:

```bash
# If ImageMagick installed:
convert -size 192x192 xc:'#0066ff' -fill white -gravity center -pointsize 96 -annotate +0+0 'S' public/icon-192.png
convert -size 512x512 xc:'#0066ff' -fill white -gravity center -pointsize 256 -annotate +0+0 'S' public/icon-512.png
```

If ImageMagick is not installed, manually create two solid blue (#0066ff) PNGs of sizes 192×192 and 512×512 using any tool (Preview > New from Clipboard works on macOS after copying a colored rectangle from any source). Save to `public/icon-192.png` and `public/icon-512.png`. Real branding can come later.

- [ ] **Step 3: Add Apple PWA meta tags** — modify `src/app/layout.tsx`

Update the Metadata export:
```tsx
export const metadata: Metadata = {
  title: "Mi Salud",
  description: "Personal health management",
  appleWebApp: {
    capable: true,
    title: "Mi Salud",
    statusBarStyle: "default",
  },
  icons: { apple: "/icon-192.png" },
};

export const viewport = {
  themeColor: "#0066ff",
};
```

- [ ] **Step 4: Verify manifest in DevTools**

```bash
pnpm dev
```

Open http://localhost:3000, DevTools > Application > Manifest — should show name, icons, theme color. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/app/manifest.ts src/app/layout.tsx public/icon-192.png public/icon-512.png
git commit -m "feat(pwa): add manifest and icons"
```

---

### Task 18: Service worker (serwist)

**Files:**
- Modify: `package.json`, `next.config.ts`
- Create: `src/app/sw.ts`

- [ ] **Step 1: Install serwist**

```bash
pnpm add serwist
pnpm add -D @serwist/next
```

- [ ] **Step 2: Service worker entry** — `src/app/sw.ts`

```ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

- [ ] **Step 3: Wrap config** — replace `next.config.ts`

```ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  reactStrictMode: true,
});
```

- [ ] **Step 4: Add `public/sw.js` to `.gitignore`**

Append to `.gitignore`:
```
public/sw.js
public/swe-worker-*.js
```

- [ ] **Step 5: Build and verify SW exists**

```bash
pnpm build
ls public/sw.js
```

Expected: `public/sw.js` exists.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pwa): add serwist service worker"
```

---

### Task 19: E2E smoke test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Playwright config** — `playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Install Playwright browsers**

```bash
pnpm dlx playwright install chromium
```

- [ ] **Step 3: Smoke test** — `tests/e2e/auth.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test("logged-out user is redirected to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Mi Salud" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("login page submits magic link request", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: /magic link/i }).click();
  await expect(page.getByText("Revisa tu email")).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 4: Run E2E**

```bash
pnpm test:e2e
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test: add E2E smoke tests for auth flow"
```

---

### Task 20: Deploy to Vercel

**Files:** (no source changes — manual setup)

- [ ] **Step 1: Push repo to GitHub**

If a GitHub remote isn't set yet, create a private repo at https://github.com/new called `mi-salud` (don't initialize with README — empty repo). Then:

```bash
git remote add origin git@github.com:YOUR_USERNAME/mi-salud.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Import to Vercel**

Visit https://vercel.com/new, import the GitHub repo. Framework: Next.js (auto-detected). Build command default. Output directory default.

- [ ] **Step 3: Add environment variables**

In Vercel project settings > Environment Variables, add for **Production + Preview + Development**:
- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key

- [ ] **Step 4: Trigger initial deploy**

Click "Deploy" in Vercel. Wait for build to complete (~2-3 min).

- [ ] **Step 5: Update Supabase auth URLs**

In Supabase dashboard > Authentication > URL Configuration, add the Vercel production URL:
- **Site URL:** `https://YOUR_PROJECT.vercel.app`
- **Redirect URLs:** also add `https://YOUR_PROJECT.vercel.app/auth/callback` (and any preview pattern like `https://*.vercel.app/auth/callback` if desired)

- [ ] **Step 6: Verify production login**

Open `https://YOUR_PROJECT.vercel.app`, log in with magic link, verify you reach the empty Hoy dashboard. Confirm sidebar navigation works.

- [ ] **Step 7: (Optional) Install as PWA on phone**

Open the production URL on iPhone Safari → Share → "Add to Home Screen". Tap the icon — app should open standalone (no Safari chrome).

- [ ] **Step 8: Document deploy URL in README**

Create `README.md` at project root:
```markdown
# Mi Salud

Personal health management PWA.

- **Production:** https://YOUR_PROJECT.vercel.app
- **Spec:** [docs/superpowers/specs/2026-05-04-health-app-design.md](docs/superpowers/specs/2026-05-04-health-app-design.md)
- **Plans:** [docs/superpowers/plans/](docs/superpowers/plans/)

## Local development

\`\`\`bash
pnpm install
cp .env.example .env.local  # fill with your Supabase keys
pnpm dev
\`\`\`

## Tests

\`\`\`bash
pnpm test          # unit
pnpm test:e2e      # E2E
\`\`\`
```

```bash
git add README.md
git commit -m "docs: add README with production URL and dev setup"
git push
```

---

## Done criteria

After completing all tasks, all of these should be true:
- [ ] `pnpm dev` runs without errors
- [ ] `pnpm build` succeeds
- [ ] `pnpm typecheck` reports 0 errors
- [ ] `pnpm test` passes (3 nav tests)
- [ ] `pnpm test:e2e` passes (2 auth tests)
- [ ] Visiting `/` while logged out redirects to `/login`
- [ ] Magic link email arrives within 1 minute
- [ ] After clicking magic link, user lands on `/` and sees "Hoy" header
- [ ] All 7 nav items navigate to their respective placeholder pages
- [ ] Mobile width (≤767px) shows bottom nav and hides sidebar
- [ ] Production URL works end-to-end on Vercel
- [ ] Manifest visible in DevTools > Application
- [ ] Service worker registers in production (DevTools > Application > Service Workers)

---

## Out of scope for this plan (deferred to Plan 2+)

- All 5 modules' actual functionality (CRUD, lists, forms)
- Hoy dashboard composition (just placeholder for now)
- Google OAuth (only magic link in Plan 1)
- Export/import JSON
- Streak calculations and any other business logic
- Tendencias / charts
- Realtime sync subscriptions (TanStack Query is enough for v1)
