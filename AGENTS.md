<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mi Salud — app personal de salud

App **privada de un solo usuario** para trackear salud diaria: suplementos, hábitos,
ejercicio, alimentación y biomarcadores. Uso personal, no multi-tenant.

## Stack

- **Next.js 16** (App Router, `--webpack`), React 19, TypeScript
- **Supabase** (Postgres + PostgREST) — proyecto ref `rfyddhiutlcewsaykval`
- **TanStack Query** (React Query) para todo el data-fetching y mutaciones
- **Tailwind v4** + componentes estilo shadcn sobre `@base-ui/react`
- **serwist** (PWA / service worker)
- Deploy: **Vercel** → producción `https://health-app-tau-gold.vercel.app`

## Comandos

```bash
pnpm install
pnpm dev         # dev server en :3000 (usa --webpack, no turbopack)
pnpm build       # build de producción
pnpm typecheck   # tsc --noEmit — CORRE ESTO antes de dar por terminado un cambio
pnpm test        # vitest
pnpm test:e2e    # playwright
```

## Env

Copia `.env.example` a `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ALLOWED_EMAIL` — único email autorizado para iniciar sesión
- `NEXT_PUBLIC_APP_TIME_ZONE` — calendario civil usado en toda la app (default `America/Monterrey`)

## Módulos (rutas en `src/app/(app)/`)

- **Hoy** (`/`) — checklist del día que agrega tareas de TODOS los módulos (ejercicio + suplementos + hábitos)
- **Suplementos** (`/suplementos`) — catálogo con horarios (ayunas/desayuno/cena/noche/antes_dormir), dosis y stacks
- **Hábitos** (`/habitos`) — hábitos con momento del día y días de la semana
- **Comer** (`/comer`), **Mover** (`/mover`, ejercicio), **Biomarcadores** (`/labs`), **Ajustes** (`/ajustes`)

## Convenciones críticas (el "por qué" no obvio)

- **Autenticación obligatoria + RLS ACTIVADO.** Aunque es una app personal de un solo usuario,
  está desplegada públicamente y contiene datos sensibles. Todas las tablas deben restringir
  SELECT/INSERT/UPDATE/DELETE con `auth.uid() = user_id` (o heredar ownership del padre).
- **Nunca hardcodees `USER_ID`.** Las mutaciones obtienen el usuario validado con
  `requireUserId()`; `ALLOWED_EMAIL` limita el acceso al propietario de la app.
- **`src/types/database.types.ts` se mantiene A MANO** (no hay Supabase local para `db:types`).
  Si cambias el esquema, actualiza ese archivo manualmente para que compile.
- Todos los hooks de query/mutación son `"use client"`, usan `createClient()` de
  `@/lib/supabase/client` y TanStack Query. Sigue el patrón existente en `src/lib/<módulo>/`.
- Todo cálculo de “hoy” usa `src/lib/date.ts`; no dependas de la zona horaria del servidor
  ni mezcles `getDay()` con `getUTCDay()`.
- Las escrituras compuestas de suplementos y stacks pasan por las RPC `save_supplement`
  y `save_supplement_stack`, para conservar atomicidad.

## Base de datos (Supabase remoto)

- Migraciones en `supabase/migrations/` (orden por timestamp). Seeds en `supabase/seed/`.
- **Bootstrap no destructivo:** `supabase/apply-all.sql` — pégalo en el SQL Editor de Supabase
  o córrelo por `psql`. Actualiza por nombre sin borrar logs ni registros personales.
- **Al aplicar DDL que crea tablas:** PostgREST cachea el esquema y devuelve 404/vacío hasta
  recargar. Ejecuta `notify pgrst, 'reload schema';` después de crear tablas.
- Aplicar a remoto: `psql` con la connection string directa, o el SQL Editor del dashboard.
  (El CLI `supabase db push` requiere `supabase link` con access token + db password.)

## Estado / pendientes

- **Migración `20260623010000_supplement_cadences.sql` NO aplicada al remoto todavía** —
  ajusta días de la semana (diario vs espaciado) y quita "Sea Moss". Aplicar cuando haya acceso a la BD.
- **Migración `20260713000000_authenticated_rls.sql` NO aplicada al remoto todavía** —
  normaliza RLS y políticas para todas las tablas. Aplicarla antes de desplegar este cambio.
- **Migración `20260713010000_atomic_catalog_writes.sql` NO aplicada al remoto todavía** —
  agrega las RPC transaccionales requeridas por las mutaciones de suplementos y stacks.
- **Plan de ejercicio (Mover):** se diseñó una calibración (plantillas A/B en formato superset
  de 45 min + cardio Zona 2 en días sueltos) pero **aún no está montada** en el módulo. Ver
  `supabase/seed/workout-seed.sql` para la estructura actual del plan.

## Contexto de salud

`docs/2026-06-22-health-bookmarks-knowledge.md` es la base de conocimiento (suplementos,
hábitos, jerarquía de longevidad) que fundamenta las recomendaciones de la app.
