# Mi Salud — Personal Health Management App

**Status:** Design approved · ready for implementation plan
**Date:** 2026-05-04
**Author:** Maximiliano Winkler + Claude (brainstorming session)
**References:** [Simón Levy Longevity Lab](https://longevity.simonlevy.mx) (UX inspiration), Drive doc "Health App" (content / practices)

---

## 1. Overview

Web app personal (PWA) para llevar control integral de salud diaria: hábitos, suplementación, alimentación, ejercicio y biomarcadores. Single-user con cloud sync para usar en celular y laptop. Estética tech-minimal (Linear/Notion vibe), no editorial-serif.

**Goal v1:** Esqueleto completo de los 5 módulos must-have con CRUD básico + daily logging UX optimizado para celular + dashboard "Hoy" como home.

**Non-goal v1:** Profundidad analítica, integraciones con wearables, médico virtual, OCR de labs.

---

## 2. Scope

### v1 — In scope

- Módulos: Hábitos, Suplementación, Alimentación (light tracking), Ejercicio, Biomarcadores
- Pantalla "Hoy" como home con resumen diario
- Auth: Google OAuth + email magic link
- Cloud sync (Supabase Postgres)
- PWA con offline support (lectura desde cache + queue de mutaciones)
- Import / export JSON (data portability)
- Responsive: desktop sidebar / mobile bottom nav

### Out of scope (v2+)

- Sleep tracking dedicado
- Péptidos / protocolos terapéuticos
- Calculadoras (PhenoAge, riesgo CV, edad biológica)
- Gráficas de tendencias avanzadas (más allá de sparklines)
- Médico virtual con LLM
- Importar PDFs de labs (OCR / parser)
- Sync con wearables (Apple Health, Garmin, Oura)
- Multi-user (compartir con coach o médico)

---

## 3. Architecture & Tech Stack

### Frontend

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui (componentes accesibles, look Linear/Notion)
- **State / Data:** TanStack Query v5 (server state, offline cache, mutaciones optimistas)
- **Forms:** react-hook-form + zod (validación)
- **Charts:** Recharts (sparklines, line charts para biomarcadores)
- **PWA:** serwist (service worker, manifest, offline strategies)

### Backend

- **All-in-one:** Supabase
  - Postgres (DB)
  - Auth (Google OAuth + magic link)
  - Realtime (sync optimista entre dispositivos)
  - Storage (lab PDFs, opcional)
  - Row Level Security en cada tabla

### Deploy

- Repo: GitHub
- Hosting: Vercel (preview por PR, auto-deploy main)
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Custom domain: opcional

### Costo recurrente

- Vercel free tier: $0
- Supabase free tier: $0 (500MB DB / 1GB storage / 50K MAU — sobra para 1 usuario)
- Domain: $12/año si quieres uno propio

### Por qué este stack

- Next.js → mejor PWA support en React, SSR para carga rápida, file-based routing
- Tailwind + shadcn → estética tech-minimal lista de fábrica
- Supabase → reemplaza ~5 servicios separados (DB, auth, storage, realtime, RLS) en uno
- TanStack Query → patrón estándar offline-first; mutaciones optimistas + retry queue

---

## 4. Visual Identity

### Direction

Tech-minimal, Linear/Notion vibe. Sans-serif, generous whitespace, subtle gray borders, bold typographic hierarchy. **Específicamente NO** la estética editorial-serif de Simón Levy (rechazada en brainstorming a favor de la opción C).

### Color tokens

```
--bg:            #ffffff
--surface:       #fafafb
--surface-alt:   #f6f6f8
--border:        #e8e8ea
--border-strong: #ececef
--text:          #1a1a1c
--text-muted:    #6e6e73
--text-subtle:   #8e8e93
--accent:        #0066ff   (azul, link / active / primary)
--accent-bg:     #eef2ff   (azul muy claro, active state)
--success:       #6b8e3d   (verde oliva, "óptimo")
--warning:       #b89a3d   (mostaza, "vigilar")
--danger:        #c4502e   (terracota, "atender" / mala calidad)
```

(Soportar dark mode: equivalentes invertidos, no urgente para v1 pero arquitectura preparada via tokens.)

### Typography

- **Sans:** Inter (`-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`)
- **Mono (labels pequeños):** `'JetBrains Mono', ui-monospace, monospace`
- H1 página: 30-38px, weight 700, letter-spacing -0.02em
- H2 sección: 20-22px, weight 700, letter-spacing -0.02em
- Body: 13-14px, weight 400-500
- Labels uppercase: 11px, weight 600, letter-spacing 0.04em

### Componentes shadcn iniciales

Button, Card, Dialog, Sheet (drawer mobile), Form, Input, Select, Tabs, Toast, Tooltip, Calendar, Badge, Checkbox, Skeleton.

---

## 5. Navigation & Shell

### Desktop (≥768px)

- Left sidebar 220px, colapsable a 56px (solo íconos)
- Brand arriba (logo + "Mi Salud")
- Secciones agrupadas:
  - **Hoy** (item solitario, destacado)
  - **Tracking:** Hábitos · Suplementación · Alimentación · Ejercicio
  - **Salud:** Biomarcadores
  - **Cuenta:** Ajustes
- Active item: fondo `--accent-bg`, texto `--accent`, ícono tinted

### Mobile (<768px)

- Bottom nav fija con 6 tabs (íconos + label corto):
  Hoy · Hábitos · Sups · Comer · Mover · Labs
- Top bar: nombre del módulo + meta (fecha + racha)
- FAB azul para quick-add (contextual al módulo)

### Header común

- Título del módulo + meta (fecha actual + racha en "Hoy")
- Botón "+ Nuevo" / "+ Sesión" / etc. arriba a la derecha

---

## 6. Modules

### 6.1 Hoy (home)

**Purpose:** Surface what you need to do today. Cero clicks para ver lo pendiente.

**Layout:**
- Stat row (4 cards): `Hábitos X/Y` · `Suplementos X/Y` · `Comidas N` · `🔥 Racha N`
- Grid 2×2 de paneles:
  - **Suplementos pendientes** (próximo time block)
  - **Hábitos clave** (top 5 — pinned por usuario en Ajustes; default = primeros 5)
  - **Comidas hoy** (count + quick-add)
  - **Ejercicio** (última sesión + quick-add)
- Inline check-off (sin abrir detalle)

### 6.2 Hábitos

**Purpose:** Tracking de hábitos diarios estilo "habit tracker".

**Vista lista:**
- Por hábito: nombre + categoría/fuente (ej. "de Sleep 101 · circadiano") + grid semanal L M X J V S D + racha 🔥
- Día completado: cell azul sólido. Hoy: borde azul. Pendiente: outline gris.
- Tap en cell para toggle.

**CRUD:**
- Agregar (modal): nombre, descripción, categoría, fuente, frecuencia (diaria | X veces/semana)
- Editar: mismos campos
- Archivar: NO eliminar (preserva logs históricos). Ítem desaparece de vista activa pero queda en DB con `archived_at` set.

**Hábitos seed (precargados, editables):** los 7 fundamentos de Sleep 101 + algunos de los anti-inflamatorios del Drive doc. Total ~22 items.

### 6.3 Suplementación

**Purpose:** Stack diario con tracking de cumplimiento.

**Vista:**
- Agrupado por momento: ☀ Mañana · 🌤 Mediodía · 🌙 Noche · 🛏 Antes de dormir
- Por suplemento: checkbox + nombre + dosis + (badge de ciclo si aplica) + cumplimiento últimos 7 días "X/7"
- Tap checkbox → mark taken hoy (en ese block)

**Soporte de ciclos:**
- Default: `cycle = null` (diario)
- Ciclado: `cycle = {on: 5, off: 2}` (ej. modafinil)
- La app calcula si "hoy debes tomarlo" basado en fecha + ciclo
- Cumplimiento se calcula contra días que tocaba

**CRUD:**
- Agregar: nombre, dosis, unidad, time_block, notas, cycle
- Editar
- Archivar (igual que hábitos)

**Seed:** stack del Drive doc (Creatina, Glicina, Omega-3, Magnesio, Vit D+K2, CoQ10, Whey, Psyllium…)

### 6.4 Alimentación (light tracking)

**Purpose:** Logging diario de baja fricción (1 tap por comida).

**Modelo:**
- Comida = quality (`good` / `mid` / `bad`) + tags (text[]) + nota libre opcional
- NO macros, NO gramos, NO base de datos de alimentos
- Tags ejemplo: `ayuno_14h`, `alta_proteína`, `azúcar_añadido`, `comí_afuera`, `aceite_de_semillas`, `sin_gluten`

**Vista semanal:**
- Grid 7 columnas (días) × 3-4 filas (desayuno / comida / cena / [snack])
- Cada celda: ✓ verde / ⚠ mostaza / ✗ terracota — tap para ver detalle/editar

**Quick-add:**
- "+ Comida ahora" → modal: tipo de comida (auto según hora), quality (3 botones grandes), tags chips multiselect, nota opcional
- 5-10 segundos máximo

**Ventana de ayuno:**
- Trackea start/end de ayuno (manual o auto desde última comida)
- Barra de progreso vs target hours (default 14h)
- Al "abrir" ventana: cierra automáticamente al registrar primera comida

**Tags:**
- Lista crece según los uses. Sugerencias top 5 más usados al crear nueva comida.
- Editable en Ajustes (renombrar / eliminar tags muertos).

### 6.5 Ejercicio (expandido — diseño v2 post-intake)

**Purpose:** App de entrenamiento completa para hipertrofia + fuerza para principiantes/intermedios. Plan-driven (no solo log libre): el usuario tiene un plan estructurado, la app le dice qué toca hoy, traquea ejecución set por set, mide cumplimiento, sugiere recuperación.

**Capacidades v1:**

1. **Múltiples planes guardados, uno activo a la vez.** Cada plan = mesociclo de N semanas (default 4) con rotación de workouts.
2. **Plan = secuencia de workouts** (Workout A, Workout B, …) mapeados a días de la semana. Días sin workout pueden ser etiquetados (Tenis, Descanso, Cardio Z2, etc.).
3. **Workout template:** lista ordenada de ejercicios con sets prescritos, rango de reps, RPE objetivo, descanso, notas (warm-up, superset).
4. **Ejercicio:** entidad de catálogo con name, type (strength/cardio/mobility/plyometric), muscle_groups[], equipment[], technique (descripción), image_url (generada por Gemini, lazy), substitute_ids[].
5. **Sesión activa:** UX para hacer el workout — ejercicio actual con imagen, inputs de sets (peso × reps por set), cronómetro de descanso, navegación entre ejercicios, sustituir ejercicio si no hay equipo, marcar como skip.
6. **Set logs:** cada set es 1 row con peso (kg), reps, opcional RPE. Para cardio: duración_sec.
7. **PR detection automática:** al guardar un set, si supera el max histórico (peso × reps o e1RM), `is_pr = true` + 🏆.
8. **Cumplimiento %:** ejercicios prescritos en plan activo / ejercicios completados en la semana. Display en home y módulo.
9. **Sustitutos:** catálogo de ejercicios mantiene `substitute_ids` curado por seed (ej. press banca → press banca con mancuernas, push-ups). Durante sesión activa el botón "Sustituir" muestra esos.
10. **Daily complementary tip:** la app muestra UNA recomendación complementaria por día (recovery, sueño, estrés, nutrición, movilidad, supplementación). Pool de ~40 tips, rotación inteligente (no repetir últimos 7 días, evitar 2 de la misma categoría seguidas). Marcable como "hecho" o "skip".

**Vista principal `/mover` (4 tabs):**

- **Hoy** — banner del workout/actividad de hoy según schedule; CTA grande "Empezar entrenamiento" o "Hoy es tenis 🎾" / "Día de descanso 😴"; daily tip card debajo
- **Plan** — vista de la semana con cada día y su workout/actividad asignada; click en día → preview del workout
- **Historial** — lista cronológica de sesiones pasadas; click → detalle con todos los sets
- **Ejercicios** — librería de ejercicios con búsqueda + filtros por músculo/equipo; click → detalle con imagen, técnica, sustitutos, historial de PRs

**Sesión activa (modal/full-screen):**

- Header: nombre del workout + progreso "3 de 7"
- Body: ejercicio actual con imagen + nombre + prescripción (sets × reps × RPE objetivo)
- Inputs de sets en tabla: # | Peso | Reps | RPE (último opcional). Auto-fill peso del último entreno.
- Cronómetro de descanso entre sets (configurable, default por ejercicio)
- Botones: "Set hecho" / "Sustituir" / "Skip ejercicio" / "Siguiente ejercicio"
- Al completar: pantalla de resumen (duración total, PRs logrados, RPE general, nota opcional)

**Mesociclo + progresión sugerida:**

- W1: peso conservador, RPE 6-7 (aprende técnica)
- W2: +2.5kg compuestos, RPE 7
- W3: peso al límite, RPE 8
- W4: deload — peso al 80% de W3, mismo volumen
- W5 (= W1 nuevo ciclo): +2.5-5kg sobre W3 anterior

App muestra peso sugerido al iniciar set basado en último entreno + week multiplier. Usuario puede override.

**Imágenes vía Gemini API:**

- Generación lazy: cuando el usuario abre el detalle de un ejercicio sin imagen, request a Gemini Imagen API
- Prompt template: "Anatomical illustration of {exercise_name}, person performing the movement correctly, clean white background, professional fitness diagram style, {view_angle}, showing proper form. No text, no logos."
- Resultado guardado en Supabase Storage bucket `exercise-images/`
- Cache forever, regenerable por user request
- Costo: ~$0.04/imagen × 30-50 ejercicios iniciales = $1-2 one-time

**Seed inicial (precargado para usuario nuevo):**

- ~30 ejercicios curados (los del plan personal del usuario + variantes comunes + sustitutos)
- 1 plan activo: "Full Body 3x — Mes 1" con 2 templates (Workout A: squat focus, Workout B: deadlift focus) mapeados Lun/Mié/Sáb
- ~40 daily tips categorizados

**Tipos seed (catálogo de exercise_types simplificado):**

Strength · Cardio · Mobility · Plyometric. Sin granular cardio_z2/hiit dentro del enum — eso se captura como ejercicio individual ("Caminata Z2", "Sprints HIIT", "Tenis").

### 6.6 Biomarcadores

**Purpose:** Centralizar resultados de labs y ver tendencia.

**Vista:**
- Agrupado por sistema: Cardiovascular · Metabólico · Hígado · Riñón · Hormonal · Micronutrientes · Inflamación · Sangre
- Por biomarcador: nombre, valor más reciente, rango óptimo, sparkline (últimos N resultados), status badge
- Status calculado: `Óptimo` (dentro de rango óptimo), `Vigilar` (dentro de rango normal pero fuera del óptimo), `Atender` (fuera de rango)

**Agregar resultado:**
- Modal: biomarker, value, taken_at (date), lab_name, nota, [adjuntar PDF opcional]
- Si PDF se sube → bucket Supabase Storage privado, signed URL guardada

**Catálogo seed:** 23 biomarcadores precargados con sus rangos (lista basada en Simón Levy + Drive doc). Usuario puede agregar más / editar rangos.

---

## 7. Data Model (Postgres / Supabase)

Todas las tablas:
- Tienen `id` (uuid, default gen_random_uuid()), `user_id` (uuid, FK auth.users)
- Tienen `created_at`, `updated_at` (timestamptz, default now())
- Tienen RLS policies: `user_id = auth.uid()` para SELECT/INSERT/UPDATE/DELETE

### Catálogos

| Tabla | Columnas |
|---|---|
| `habits` | name (text), description (text), category (text), source (text), frequency_per_week (int default 7), archived_at (timestamptz null) |
| `supplements` | name (text), dose (numeric), unit (text), time_block (enum: am/midday/pm/before_sleep), notes (text), cycle (jsonb null), archived_at |
| `meal_tags` | tag (text unique per user), use_count (int) |
| `exercises` | name (text), exercise_type (enum: strength/cardio/mobility/plyometric), muscle_groups (text[]), equipment (text[]), technique (text), image_url (text null), image_prompt (text), substitute_ids (uuid[]), is_seed (bool default false), archived_at |
| `biomarkers` | name (text), system (enum: cardiovascular/metabolic/liver/kidney/hormonal/micronutrient/inflammation/blood), unit (text), range_min (numeric), range_max (numeric), range_optimal_min (numeric), range_optimal_max (numeric), archived_at |
| `daily_tips` | category (enum: sleep/stress/recovery/nutrition/mobility/supplement/other), context (text[]), title (text), content (text), priority (int 1-5 default 3), is_seed (bool default false), archived_at |

### Catálogos — Plan estructurado de entrenamiento

| Tabla | Columnas |
|---|---|
| `workout_plans` | name (text), description (text), is_active (bool default false), mesocycle_weeks (int default 4), current_week (int default 1), current_week_started_at (date) |
| `workout_templates` | plan_id (uuid FK), name (text), position (int) |
| `workout_template_exercises` | template_id (uuid FK), exercise_id (uuid FK exercises), position (int), prescribed_sets (int), reps_min (int), reps_max (int), target_rpe (int), rest_seconds (int default 90), is_warmup (bool default false), superset_with_position (int null), notes (text) |
| `plan_schedule_slots` | plan_id (uuid FK), day_of_week (int 0-6, 0=Sun), template_id (uuid FK workout_templates null), activity_label (text — usado si template_id es null, ej. "Tenis", "Descanso") |

### Logs

| Tabla | Columnas |
|---|---|
| `habit_logs` | habit_id (uuid FK), date (date) — row presence = completado; uncheck = DELETE |
| `supplement_logs` | supplement_id (uuid FK), date (date), time_block (enum) — row presence = tomado; uncheck = DELETE |
| `meals` | date (date), meal_type (enum: desayuno/comida/cena/snack), quality (enum: good/mid/bad), tags (text[]), note (text), eaten_at (timestamptz) |
| `fasting_windows` | start_at (timestamptz), end_at (timestamptz null), target_hours (numeric default 14) |
| `workout_sessions` | template_id (uuid FK workout_templates null — null si freestyle), date (date), status (enum: planned/in_progress/completed/skipped default 'planned'), started_at (timestamptz), ended_at (timestamptz), duration_min (int), overall_rpe (int 1-10), notes (text) |
| `exercise_set_logs` | session_id (uuid FK), exercise_id (uuid FK), set_number (int), reps (int null), weight_kg (numeric null), duration_sec (int null), rpe (int null), is_pr (bool default false), notes (text) |
| `daily_tip_logs` | date (date), tip_id (uuid FK daily_tips), status (enum: shown/done/skipped default 'shown') |
| `lab_results` | biomarker_id (uuid FK), value (numeric), taken_at (date), lab_name (text), note (text), source_pdf_url (text null) |

### Cuenta

| Tabla | Columnas |
|---|---|
| `profiles` | user_id (uuid PK + FK auth.users), display_name (text), birthdate (date null), units_pref (enum: metric/imperial default metric), timezone (text default 'America/Mexico_City') |

### Storage

- Bucket `lab-pdfs`, private, RLS user-scoped (path prefix = user_id)
- Bucket `exercise-images`, public-read RLS scoped por user_id en path (cada usuario controla sus generaciones); imágenes generadas vía Gemini Imagen API

### Indexes

- `(user_id, date)` en `habit_logs`, `supplement_logs`, `workout_sessions`, `meals`
- `(user_id, biomarker_id, taken_at DESC)` en `lab_results`
- `(user_id, archived_at)` en catálogos para queries de "activos"
- `(user_id, is_active)` en `workout_plans` (lookup del plan activo)
- `(user_id, plan_id, day_of_week)` en `plan_schedule_slots`
- `(user_id, session_id, exercise_id, set_number)` en `exercise_set_logs`
- `(user_id, exercise_id, weight_kg DESC)` en `exercise_set_logs` para detección de PRs

### Constraints

- Unique `(user_id, habit_id, date)` en `habit_logs`
- Unique `(user_id, supplement_id, date, time_block)` en `supplement_logs`
- Unique `(user_id, plan_id, day_of_week)` en `plan_schedule_slots` (un slot por día)
- Partial unique index: solo 1 plan activo por usuario (`unique (user_id) where is_active = true` en `workout_plans`)

### Migrations

- Manejar con Supabase CLI: `supabase/migrations/` versionado en git
- Seed inicial: `supabase/seed.sql` con biomarcadores, ~30 ejercicios curados, daily_tips (~40), opcionalmente plan inicial Full Body 3x

### Server-side: Gemini Imagen integration

- Server-only env var: `GEMINI_API_KEY`
- Endpoint: `app/api/exercises/[id]/regenerate-image/route.ts` (POST, auth required)
- Genera imagen → sube a Storage `exercise-images/{user_id}/{exercise_id}.png` → actualiza `exercises.image_url`
- Rate limit: max 10 generaciones/día por user (cuota Gemini free tier)

---

## 8. Auth & Privacy

### Auth flow

- **Login:** Google OAuth (1 click) o magic link por email
- **No passwords**
- Sesión persistente por dispositivo (cookies httpOnly)
- Logout → `supabase.auth.signOut()` + clear local cache

### Privacy

- RLS en todas las tablas: imposible leer/escribir data de otro usuario incluso si la API se compromete
- Lab PDFs: bucket privado, signed URLs con TTL corto (1h)
- No analytics de terceros (no Google Analytics, no PostHog) en v1
- No tracking de ubicación, no IP logs

### Eliminación de cuenta

- Botón "Borrar cuenta y toda mi data" en Ajustes
- Trigger SQL: cascade delete de todas las tablas user-scoped + delete user en auth.users
- Confirmación con texto ("escribe BORRAR para confirmar")

---

## 9. PWA & Offline

### Service worker (serwist)

- App shell (HTML/CSS/JS) precached → app abre instantáneo aunque no haya red
- Static assets: cache-first
- API calls (Supabase): network-first con fallback a cache

### Datos offline

- TanStack Query persiste cache en IndexedDB (vía `@tanstack/query-async-storage-persister`)
- Lecturas: sirve de cache primero, refresca en background cuando hay red
- Mutaciones offline: encoladas en IndexedDB, ejecutadas al volver red (con retry exponential backoff)
- Conflict strategy: last-write-wins por ahora (single-user, conflictos raros)

### Install

- Manifest con íconos 192px y 512px, theme_color, name, short_name
- iOS: meta tags `apple-mobile-web-app-capable`, ícono apple-touch
- Banner discreto "Add to Home Screen" la primera vez en mobile

### Updates

- Detect new SW version via serwist hook
- Banner discreto: "Hay actualización · recargar"
- No force-reload (respeta sesión activa)

---

## 10. Edge Cases & Decisions

| Tema | Decisión |
|---|---|
| Eliminar item del catálogo | NO eliminar — `archived_at` set. Logs históricos intactos. |
| Zonas horarias | UTC en DB, render en `profiles.timezone`. Timestamps con `timestamptz`. |
| Unidades | Canónico en métrico. Si user pref = imperial, convertir en render. |
| Export | Botón "Descargar mi data" → JSON con todas las tablas. |
| Import | Subir JSON exportado → confirmación → replace o merge (default replace). |
| Eliminación de cuenta | Botón explícito + confirmación texto + cascade delete. |
| Día sin data | Muestra "—" en sparklines, "0/N" en contadores, mensaje vacío amigable en listas. |
| Cambio de fecha del dispositivo | Refrescar query de "Hoy" cuando app vuelve a foreground. |
| Birthdate sin proveer | OK, solo opcional para futuras calculadoras (PhenoAge en v2+). |

---

## 11. Testing

Proporcional a uso personal — NO target de coverage.

- **Vitest:** lógica pura
  - Cálculo de streak (días seguidos completados)
  - Conversiones de unidades
  - Cálculo de ventana de ayuno y porcentaje vs target
  - "¿Hoy toca tomarlo?" para suplementos con ciclo
  - Status de biomarker (óptimo/vigilar/atender)
- **Playwright:** 2-3 happy paths E2E
  - Login con magic link → ver dashboard
  - Marcar hábito + suplemento desde "Hoy"
  - Agregar resultado de lab y verlo en biomarcadores
- **Manual:** UX en mobile real (Safari iOS) antes de cada release

---

## 12. Deployment & Workflow

- **Repo:** GitHub privado
- **CI:** GitHub Actions (lint + typecheck + test) en PR
- **CD:** Vercel auto-deploy
  - PR → preview deploy con URL única
  - Merge a `main` → producción
- **DB migrations:** Supabase CLI, aplicadas manualmente desde local con `supabase db push` (o GitHub Action en futuro)
- **Secrets:** Supabase keys en Vercel env vars (production / preview / development)
- **Backups:** Supabase free tier no incluye backup automático. Mitigación: export JSON manual periódico (botón en Ajustes), guardar en Drive.

---

## 13. Out of Scope / Roadmap futuro

### v2 candidates
- Sleep tracking dedicado (los 7 fundamentos como módulo, no solo hábitos)
- Calculadoras: PhenoAge (edad biológica), riesgo CV, otras
- Vista de tendencias avanzada (gráficas de cualquier métrica × tiempo)
- Péptidos / protocolos terapéuticos como módulo separado

### v3 candidates
- Médico virtual (LLM con tu data como contexto)
- Importar PDFs de labs (OCR + parser estructurado)
- Sync con wearables: Apple Health, Garmin, Oura
- Dark mode

### v4+ candidates
- Multi-user (compartir read-only con coach o médico)
- Notificaciones push (recordatorios de suplementos por time block)
- Integraciones de farmacia/suplementos (auto-reorder)

---

## Open questions

Ninguna — diseño aprobado en brainstorming session 2026-05-04.
