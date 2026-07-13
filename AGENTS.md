<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mi Salud — app personal de salud

App **local-first de un solo usuario** para trackear salud diaria: suplementos, hábitos,
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

## Módulos (rutas en `src/app/(app)/`)

- **Hoy** (`/`) — checklist del día que agrega tareas de TODOS los módulos (ejercicio + suplementos + hábitos)
- **Suplementos** (`/suplementos`) — catálogo con horarios (ayunas/desayuno/cena/noche/antes_dormir), dosis y stacks
- **Hábitos** (`/habitos`) — hábitos con momento del día y días de la semana
- **Comer** (`/comer`), **Mover** (`/mover`, ejercicio), **Biomarcadores** (`/labs`), **Ajustes** (`/ajustes`)

## Convenciones críticas (el "por qué" no obvio)

- **Sin autenticación / RLS DESACTIVADO.** Es una app personal de un solo usuario. **Todas**
  las tablas corren con Row Level Security **apagado** y las queries/mutaciones usan un
  `USER_ID` hardcodeado. **NO actives RLS en tablas nuevas** — la sesión es anónima y RLS
  ocultaría los datos (esto ya causó un bug: habits quedó con RLS on y no mostraba nada).
- **`USER_ID` hardcodeado** = `c44deaea-9de2-4eb2-b552-307fac7ecfdf` (ver `src/lib/*/mutations.ts`).
- **`src/types/database.types.ts` se mantiene A MANO** (no hay Supabase local para `db:types`).
  Si cambias el esquema, actualiza ese archivo manualmente para que compile.
- Todos los hooks de query/mutación son `"use client"`, usan `createClient()` de
  `@/lib/supabase/client` y TanStack Query. Sigue el patrón existente en `src/lib/<módulo>/`.

## Base de datos (Supabase remoto)

- Migraciones en `supabase/migrations/` (orden por timestamp). Seeds en `supabase/seed/`.
- **Setup de un solo golpe:** `supabase/apply-all.sql` — pégalo en el SQL Editor de Supabase
  o córrelo por `psql`. Recrea catálogo de suplementos + hábitos y deja RLS off.
- **Al aplicar DDL que crea tablas:** PostgREST cachea el esquema y devuelve 404/vacío hasta
  recargar. Ejecuta `notify pgrst, 'reload schema';` después de crear tablas.
- Aplicar a remoto: `psql` con la connection string directa, o el SQL Editor del dashboard.
  (El CLI `supabase db push` requiere `supabase link` con access token + db password.)

## Estado / pendientes

- **Migración `20260623010000_supplement_cadences.sql` NO aplicada al remoto todavía** —
  ajusta días de la semana (diario vs espaciado) y quita "Sea Moss". Aplicar cuando haya acceso a la BD.
- **Plan de ejercicio (Mover):** se diseñó una calibración (plantillas A/B en formato superset
  de 45 min + cardio Zona 2 en días sueltos) pero **aún no está montada** en el módulo. Ver
  `supabase/seed/workout-seed.sql` para la estructura actual del plan.

## Contexto de salud

`docs/2026-06-22-health-bookmarks-knowledge.md` es la base de conocimiento (suplementos,
hábitos, jerarquía de longevidad) que fundamenta las recomendaciones de la app.
