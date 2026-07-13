# Mi Salud

Aplicación privada de salud para registrar hábitos, suplementos y entrenamientos en un solo lugar. Está construida como PWA con Next.js y guarda los datos en Supabase.

Producción: [health-app-tau-gold.vercel.app](https://health-app-tau-gold.vercel.app)

## Funcionalidad

- **Hoy:** resumen diario de entrenamiento, suplementos y hábitos.
- **Suplementos:** catálogo, dosis, horarios, adherencia de siete días y stacks.
- **Hábitos:** programación por día y momento, con registro diario.
- **Mover:** plan semanal, sesiones, series e historial.
- **Comer:** registro diario de alimentos, macros, edición e historial.
- **Labs:** resultados de biomarcadores, rangos del reporte, resumen e historial.
- **Ajustes:** perfil, unidades, apariencia, seguridad y cierre de sesión.

## Arquitectura

- Next.js 16 App Router, React 19 y TypeScript.
- Supabase Auth, Postgres, PostgREST y Row Level Security.
- TanStack Query para consultas, caché y mutaciones del cliente.
- Tailwind CSS v4 y componentes sobre Base UI.
- Serwist para instalación PWA y caché exclusiva de assets estáticos versionados. HTML, RSC y datos de Supabase siempre usan red; todavía no existe una cola offline.
- Vercel para despliegue.

La aplicación admite una sola cuenta. `src/proxy.ts` hace el control de navegación optimista y la base de datos aplica la autorización definitiva mediante RLS. El login nunca crea usuarios nuevos (`shouldCreateUser: false`); `ALLOWED_EMAIL` agrega una allowlist explícita cuando está configurada.

## Desarrollo local

Requisitos: Node.js compatible con Next.js 16, pnpm y un proyecto Supabase.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Variables requeridas:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Recomendado: capa adicional sobre los usuarios ya existentes en Auth
ALLOWED_EMAIL=propietario@example.com
NEXT_PUBLIC_APP_TIME_ZONE=America/Monterrey
```

No agregues `.env.local`, tokens, contraseñas ni connection strings al repositorio.

## Verificación

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Playwright inicia una instancia exclusiva en el puerto `41737`. Se puede cambiar con `PLAYWRIGHT_PORT`; nunca reutiliza un servidor existente para evitar falsos positivos.

## Base de datos

Las migraciones están ordenadas en `supabase/migrations/`. Para una instalación o actualización, aplícalas en orden cronológico con Supabase CLI, `psql` o el SQL Editor del dashboard. Las migraciones más recientes:

1. `20260623010000_supplement_cadences.sql`: corrige cadencias del catálogo inicial.
2. `20260713000000_authenticated_rls.sql`: activa y normaliza RLS en todas las tablas.
3. `20260713010000_atomic_catalog_writes.sql`: crea las RPC transaccionales de suplementos y stacks.
4. `20260713020000_nutrition_tracking.sql`: agrega registros privados de alimentación.
5. `20260713030000_biomarker_tracking.sql`: agrega resultados privados de biomarcadores.

`supabase/apply-all.sql` es un bootstrap no destructivo para el catálogo y los hábitos iniciales. Usa `upsert` por usuario y nombre, conserva logs y respeta el estado activo de registros existentes. Los archivos de `supabase/seed/` son seeds especializados; revisa su encabezado antes de ejecutarlos.

Después de cambiar el esquema remoto, recarga PostgREST con:

```sql
notify pgrst, 'reload schema';
```

Los tipos de `src/types/database.types.ts` se mantienen manualmente mientras no haya un Supabase local enlazado.

## Seguridad y datos de salud

- Todas las tablas personales deben tener RLS y políticas basadas en `auth.uid()`.
- Las mutaciones nunca aceptan un `user_id` confiado desde la UI; lo obtienen de la sesión verificada.
- Las operaciones que reemplazan relaciones se ejecutan en RPC atómicas para evitar datos parciales.
- La app es una herramienta personal de registro, no un dispositivo médico ni una fuente de diagnóstico.

La base de conocimiento utilizada para el contenido se encuentra en `docs/2026-06-22-health-bookmarks-knowledge.md`.
