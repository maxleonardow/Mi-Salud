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
- `ALLOWED_EMAIL` — allowlist recomendada; si falta, solo entran usuarios ya existentes en Supabase Auth
- `NEXT_PUBLIC_APP_TIME_ZONE` — calendario civil usado en toda la app (default `America/Monterrey`)

## Módulos (rutas en `src/app/(app)/`)

- **Hoy** (`/`) — checklist del día que agrega tareas de TODOS los módulos (ejercicio + suplementos + hábitos)
- **Suplementos** (`/suplementos`) — catálogo con horarios (ayunas/desayuno/cena/noche/antes_dormir), dosis y stacks
- **Hábitos** (`/habitos`) — hábitos con momento del día y días de la semana
- **Comer** (`/comer`) — alimentos, macros e historial
- **Mover** (`/mover`) — ejercicio, plan, sesiones e historial
- **Biomarcadores** (`/labs`) — resultados y rangos del reporte
- **Ajustes** (`/ajustes`) — perfil, unidades, apariencia y sesión

## Convenciones críticas (el "por qué" no obvio)

- **Autenticación obligatoria + RLS ACTIVADO.** Aunque es una app personal de un solo usuario,
  está desplegada públicamente y contiene datos sensibles. Todas las tablas deben restringir
  SELECT/INSERT/UPDATE/DELETE con `auth.uid() = user_id` (o heredar ownership del padre).
- **Nunca hardcodees `USER_ID`.** Las mutaciones obtienen el usuario validado con
  `requireUserId()`; `ALLOWED_EMAIL` limita el acceso al propietario de la app.
- **`src/types/database.types.ts` se mantiene A MANO** para conservar diffs revisables.
  Si cambias el esquema, actualiza ese archivo manualmente y contrástalo con `pnpm db:types`
  cuando el entorno local de Supabase esté iniciado.
- Todos los hooks de query/mutación son `"use client"`, usan `createClient()` de
  `@/lib/supabase/client` y TanStack Query. Sigue el patrón existente en `src/lib/<módulo>/`.
- Todo cálculo de “hoy” usa `src/lib/date.ts`; no dependas de la zona horaria del servidor
  ni mezcles `getDay()` con `getUTCDay()`.
- Las escrituras compuestas de suplementos y stacks pasan por las RPC `save_supplement`
  y `save_supplement_stack`, para conservar atomicidad.
- El service worker solo cachea assets estáticos. Nunca agregues HTML, RSC, API ni tráfico
  de Supabase al cache: contienen o pueden revelar datos de salud.

## Base de datos (Supabase remoto)

- Migraciones en `supabase/migrations/` (orden por timestamp). Seeds en `supabase/seed/`.
- **Bootstrap no destructivo:** `supabase/apply-all.sql` — pégalo en el SQL Editor de Supabase
  o córrelo por `psql`. Actualiza por nombre sin borrar logs ni registros personales.
- **Al aplicar DDL que crea tablas:** PostgREST cachea el esquema y devuelve 404/vacío hasta
  recargar. Ejecuta `notify pgrst, 'reload schema';` después de crear tablas.
- Aplicar a remoto: `psql` con la connection string directa, o el SQL Editor del dashboard.
  (El CLI `supabase db push` requiere `supabase link` con access token + db password.)
- Validación local completa: `supabase start` y después `pnpm test:db`. La prueba revierte
  sus fixtures y verifica grants, RLS entre dos usuarios, RPC y denegación anónima.

## Estado remoto

- **Aplicadas al remoto el 2026-07-14:** `20260623010000_supplement_cadences.sql`,
  `20260713000000_authenticated_rls.sql`, `20260713010000_atomic_catalog_writes.sql`,
  `20260713020000_nutrition_tracking.sql`, `20260713030000_biomarker_tracking.sql`,
  `20260713040000_authenticated_privileges.sql` y
  `20260713050000_default_workout_plan.sql`.
- **Aplicada al remoto el 2026-07-14:** `20260714000000_personalized_workout_plan.sql`,
  que instala de forma reversible el plan atlético de 12 semanas, conserva el historial y
  conecta alternativas para cada ejercicio. La función está disponible para `authenticated`.
- Auditoría SQL posterior: las 19 tablas esperadas existen, todas tienen RLS activo,
  `anon` no conserva privilegios directos, `authenticated` tiene los privilegios requeridos
  y están disponibles `save_supplement`, `save_supplement_stack` e
  `install_default_workout_plan` con sus permisos correctos. También se verificó
  `install_personalized_workout_plan(boolean)` con permiso de ejecución para `authenticated`.
- `supabase/seed/workout-seed.sql` queda como seed legado de catálogo amplio; el plan base A/B
  se instala desde la UI sin reemplazar planes activos.

## Contexto de salud

`docs/2026-06-22-health-bookmarks-knowledge.md` es la base de conocimiento (suplementos,
hábitos, jerarquía de longevidad) que fundamenta las recomendaciones de la app.
