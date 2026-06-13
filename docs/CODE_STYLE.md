# Code Style & Project Conventions

A portable guide to how this repository is structured. Use it as a blueprint when starting new projects or onboarding contributors.

---

## Tech Stack


| Layer         | Choice                         |
| ------------- | ------------------------------ |
| Framework     | React 19 + TypeScript (strict) |
| Build         | Vite                           |
| Routing       | TanStack Router (file-based)   |
| Server state  | TanStack Query                 |
| Client state  | Zustand                        |
| HTTP          | Axios                          |
| Styling       | Tailwind CSS v4 + CVA          |
| UI primitives | shadcn/ui (New York style)     |
| Forms         | react-hook-form + Zod          |


---

## Directory Layout

```
src/
├── assets/              # Static images, SVGs (SVGR imports supported)
├── components/
│   ├── ui/              # Low-level, reusable UI primitives (shadcn)
│   ├── molecules/       # Composed, cross-route feature components
│   └── providers/       # App-level React providers
├── hooks/
│   ├── apis/            # Domain API hooks (one file per resource)
│   └── use-*.ts(x)      # Shared utility hooks
├── lib/
│   ├── api.ts           # Axios instance + interceptors
│   ├── constants.ts     # Env keys, storage keys, API URLs
│   ├── defaults.ts      # Default values & factory helpers
│   ├── types.ts         # Central type definitions
│   └── utils.ts         # Pure utility functions
├── routes/              # File-based routes (TanStack Router)
├── stores/              # Zustand stores (use-*.ts)
├── main.tsx             # App entry — renders <Providers />
└── routeTree.gen.ts     # Auto-generated route tree (do not edit)
```

### Path Aliases

Configured in `tsconfig.json`:


| Alias            | Maps to            |
| ---------------- | ------------------ |
| `@/*`            | `src/*`            |
| `@/components/*` | `src/components/*` |
| `@/hooks/*`      | `src/hooks/*`      |
| `@/lib/*`        | `src/lib/*`        |
| `@/stores/*`     | `src/stores/*`     |
| `@/assets/*`     | `src/assets/*`     |


Always import via aliases — never use deep relative paths like `../../../`.

---

## API Hooks

### Location & naming

- One hook file per API domain: `src/hooks/apis/use-<domain>.tsx`
- Examples: `use-dashboards.tsx`, `use-cohorts.tsx`, `use-auth.tsx`
- File exports a **default factory hook** named after the domain: `useDashboards`, `useCohorts`, `useAuth`

### Factory pattern

Each domain hook is a **factory** that returns inner hooks. Components call the factory once, then destructure the hooks they need.

```tsx
// src/hooks/apis/use-dashboards.tsx
export default function useDashboards() {
  const { orgId, projectId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  const useGetDashboardById = (dashboardId: string) => {
    return useSuspenseQuery({
      queryKey: ["get-dashboard-by-id", orgId, dashboardId, projectId],
      queryFn: async () => {
        const { data } = await api.get<DASHBOARD>(
          `/orgs/${orgId}/projects/${projectId}/dashboards/${dashboardId}`,
        );
        return data;
      },
    });
  };

  const useUpdateDashboard = (dashboardId: string) => {
    return useMutation({
      mutationKey: ["update-dashboard", orgId, dashboardId, projectId],
      mutationFn: async (payload: DASHBOARD) => {
        return api.put(
          `/orgs/${orgId}/projects/${projectId}/dashboards/${dashboardId}`,
          payload,
        );
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ["get-dashboard-by-id", orgId, dashboardId, projectId],
        });
      },
    });
  };

  return { useGetDashboardById, useUpdateDashboard };
}
```

```tsx
// Usage in a component
const { useGetDashboardById, useUpdateDashboard } = useDashboards();
const { data } = useGetDashboardById(dashboardId);
const { mutateAsync } = useUpdateDashboard(dashboardId);
```

### Rules


| Rule         | Detail                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| HTTP client  | Always use `api` from `@/lib/api` — never raw `fetch` or a new Axios instance                        |
| Types        | Import response/payload types from `@/lib/types`                                                     |
| Query keys   | Kebab-case string + relevant IDs: `["get-cohorts", orgId, projectId]`                                |
| Reads        | Prefer `useSuspenseQuery` for data that blocks rendering; use `useInfiniteQuery` for paginated lists |
| Writes       | Use `useMutation` with `mutationKey`; invalidate related queries in `onSuccess`                      |
| Route params | Read via `useParams({ strict: false })` inside the factory                                           |
| Auth context | Read user from `useAuthStore` when mutations need `created_by` / `updated_by`                        |
| Errors       | Handle user-facing errors in `onError` (e.g. `toast.error`) for auth flows                           |


### Feature-scoped hooks

Hooks used by only one feature can live next to that feature instead of `hooks/apis/`:

```
routes/.../query-builder/hooks/use-query-builder-actions.ts
components/molecules/chart-builder/hooks/use-event.tsx
```

Keep API-domain hooks in `hooks/apis/`; keep UI/feature logic hooks colocated.

---

## Components

### Three tiers


| Folder                  | Purpose                           | Examples                                   |
| ----------------------- | --------------------------------- | ------------------------------------------ |
| `components/ui/`        | Atomic, style-agnostic primitives | `Button`, `Input`, `Dialog`, `Spinner`     |
| `components/molecules/` | Composed, reusable feature blocks | `Dashboard`, `AppSidebar`, `chart-builder` |
| `components/providers/` | App shell providers               | `QueryClientWrapper`, `ThemeProvider`      |


### Conventions

- **UI components** follow shadcn patterns: CVA variants, `cn()` for class merging, `forwardRef` where needed.
- **Molecules** are default-exported functions: `export default function Dashboard(...)`.
- **Route-specific components** live under the route, not in `components/`:

```
routes/~_authenticated/.../dashboards/
├── ~index.tsx                  # Thin route file
└── components/
    ├── listing.tsx             # Page component
    └── ...
```

- **Lazy-load** heavy page components from the route file:

```tsx
const DashboardListing = lazy(() => import("./components/listing"));

function RouteComponent() {
  return <DashboardListing />;
}
```

- **Colocate** helpers with the feature: `utils.ts`, `constants.ts`, `hooks/` inside the feature folder.
- **Compound components** (e.g. combobox, grid-layout) use subfolders with an `index.ts` barrel when needed.

### Styling

- Tailwind utility classes inline; use `cn()` from `@/lib/utils` to merge classes.
- Design tokens via CSS variables (`bg-background`, `text-muted-foreground`, etc.).
- Component variants via `class-variance-authority` (see `components/ui/button.tsx`).

---

## Types

### Central file: `src/lib/types.ts`

All shared domain types live in one file, organized by section:

```ts
/* ------------------------------------------------ */
/* ENUM TYPES */
/* ------------------------------------------------ */

export type QUERY_KIND = "FUNNEL" | "RETENTION" | "USER_PATHS" | ...

export enum FILTER_OP {
  AND = "AND",
  OR = "OR",
}

/* ------------------------------------------------ */
/* FILTER SYSTEM */
/* ------------------------------------------------ */

export interface FILTER_CONDITION { ... }
```

### Naming


| Kind                  | Convention                        | Example                                         |
| --------------------- | --------------------------------- | ----------------------------------------------- |
| Entity / DTO types    | `UPPER_SNAKE_CASE`                | `DASHBOARD`, `COHORT`, `USER`                   |
| Union / enum literals | `UPPER_SNAKE_CASE` type or `enum` | `PAGE_TYPE`, `CHART_TYPE`                       |
| Interfaces for shapes | `PascalCase` when nested/complex  | `FILTER_CONDITION`, `OPERATOR`                  |
| Response wrappers     | Descriptive suffix                | `CohortsListingResponse`, `CohortCountResponse` |


### Supporting files


| File               | Holds                                                  |
| ------------------ | ------------------------------------------------------ |
| `lib/types.ts`     | All shared TypeScript types                            |
| `lib/defaults.ts`  | Default configs, factory functions, valid-value arrays |
| `lib/constants.ts` | Storage keys, API URLs, debounce delays, admin lists   |
| `lib/utils.ts`     | Transform helpers (e.g. `toCohortWritePayload`)        |
| Feature `types.ts` | Only when types are truly private to one feature       |


Import types with `import type { ... }` (enforced by `verbatimModuleSyntax`).

---

## Routes

### File-based routing (TanStack Router)

Config (`tsr.config.json`):

```json
{
  "routesDirectory": "./src/routes",
  "generatedRouteTree": "./src/routeTree.gen.ts",
  "routeFilePrefix": "~",
  "routeFileIgnorePrefix": "-",
  "routeFileExtensions": ["tsx"]
}
```

### File naming → URL mapping


| File pattern          | Meaning                                                |
| --------------------- | ------------------------------------------------------ |
| `~index.tsx`          | Index route for parent path (`/`)                      |
| `~_authenticated.tsx` | Pathless layout route (wraps children, no URL segment) |
| `~$orgId`             | Dynamic param (`:orgId`)                               |
| `~login.tsx`          | Static segment (`/login`)                              |
| Files prefixed `-`    | Ignored by the router (co-located non-route files)     |


Example path:

```
routes/~_authenticated/~orgs/~$orgId/~projects/~$projectId/~dashboards/~index.tsx
→ /orgs/:orgId/projects/:projectId/dashboards
```

### Route file anatomy

Keep route files **thin**. They define routing concerns; page UI lives in `components/`.

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy } from "react";

const DashboardListing = lazy(() => import("./components/listing"));

export const Route = createFileRoute(
  "/_authenticated/orgs/$orgId/projects/$projectId/dashboards/",
)({
  component: RouteComponent,
  validateSearch: (search) => {
    /* sanitize URL search params */
  },
  beforeLoad: ({ search, params }) => {
    /* guards, redirects */
  },
  loader: ({ location }) => {
    /* prefetch data, return loader data */
  },
});

function RouteComponent() {
  return <DashboardListing />;
}
```

### Layout routes

- `~_authenticated.tsx` — app shell (sidebar, header, error boundary, suspense).
- `~_unauthenticated.tsx` — auth pages shell (centered layout).
- Feature layouts (e.g. `~_event-taxonomy.tsx`) — tabs, sub-navigation, `<Outlet />`.

### Route-level patterns


| Concern                  | Where                                                                    |
| ------------------------ | ------------------------------------------------------------------------ |
| Search param validation  | `validateSearch` on the route                                            |
| Auth / permission guards | `beforeLoad` or parent `loader`                                          |
| Data prefetch (no hooks) | `loader` — plain async functions                                         |
| Permission checks        | `lib/authorization.ts` + `useUserAccessStore`                            |
| Page UI                  | `components/` subfolder next to the route                                |
| Table columns            | `components/.../data-table/columns.tsx` as named exports (`getXColumns`) |


### Navigation

- Use `useNavigate`, `Link`, `redirect` from `@tanstack/react-router`.
- Typed routes via `Register` module augmentation in `components/providers/index.tsx`.

---

## State Management

### Server state → TanStack Query

All API data flows through hooks in `hooks/apis/`. Do not store API responses in Zustand unless you need optimistic/offline UI.

### Client state → Zustand

```
src/stores/use-<domain>.ts
```

```ts
type DashboardStore = {
  dashboard: DASHBOARD | null;
  setDashboard: (dashboard: DASHBOARD | null) => void;
  resizeRow: (rowId: string, newHeight: number) => void;
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  dashboard: null,
  setDashboard: (dashboard) => set({ dashboard }),
  // ...
}));
```

- Use `persist` middleware for values that survive refresh (auth user, theme, panel prefs).
- Selectors: `useAuthStore((state) => state.user)` — pick only what you need.
- Stores hold **UI/feature state** (layout, selections, drafts); not fetched lists.

---

## Data Tables

Listing pages use a shared pattern:

1. Wrap page in `<DataTableProvider>` (from `hooks/use-listing-data.tsx`).
2. Table state (search, sort, pagination, filters) syncs to **URL search params**.
3. API hooks read deferred state via `useDataTableState()` and `attachQueryString()`.
4. Infinite scroll listings use `useInfiniteScrollPaging`.

```tsx
export default function DashboardListing() {
  return (
    <DataTableProvider skipKey="skip" defaultLimit={12}>
      <ListingLayout />
    </DataTableProvider>
  );
}
```

---

## Forms

- Define schema with **Zod**, infer types with `z.infer<typeof schema>`.
- Wire with **react-hook-form** + `@hookform/resolvers/zod`.
- Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` components.
- Submit handlers call mutation `mutateAsync` from API hooks.

---

## Error Handling & Loading


| Pattern                 | Usage                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `useSuspenseQuery`      | Data fetching inside `<Suspense>` boundaries                                       |
| `<WrappedSuspense>`     | Defers suspense on first paint (see `providers/suspense-after-initial-render.tsx`) |
| `<ErrorBoundary>`       | Per-route or per-section fallback with `resetKeys={[pathname]}`                    |
| `<Spinner>` / skeletons | Loading fallbacks                                                                  |
| `toast` (sonner)        | Mutation error feedback                                                            |
| Axios interceptor       | 401 token refresh + redirect to `/login`                                           |


---

## Code Style Rules

### TypeScript

- `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- Use `import type` for type-only imports
- Prefer `type` over `interface` for simple unions; use `interface` for extensible object shapes
- Avoid `any`; type API responses explicitly

### Exports


| Kind                              | Export style                     |
| --------------------------------- | -------------------------------- |
| Page / feature components         | `export default function`        |
| API hooks                         | `export default function useX()` |
| Utilities, column defs, constants | Named exports                    |
| Stores                            | Named export `useXStore`         |


### Naming


| Item                  | Convention                             |
| --------------------- | -------------------------------------- |
| Files                 | `kebab-case.tsx` / `kebab-case.ts`     |
| React components      | `PascalCase`                           |
| Hooks                 | `use` + `PascalCase` (`useDashboards`) |
| Types                 | `UPPER_SNAKE_CASE` for domain entities |
| Query / mutation keys | `kebab-case` strings                   |


### Formatting

- **Double quotes** for strings
- Format on save; organize imports on save

### Imports order (typical)

1. External packages
2. `@/components/`*
3. `@/hooks/*`
4. `@/lib/*`
5. `@/stores/*`
6. Relative imports (same feature only)

### Comments

- Code should be self-explanatory
- Add comments for non-obvious business logic, not for what the code literally does
- Large hooks (e.g. `use-listing-data`) get a top-of-file docblock explaining purpose

---

## Lib Utilities


| File               | Role                                             |
| ------------------ | ------------------------------------------------ |
| `api.ts`           | Singleton Axios client, auth interceptor         |
| `authorization.ts` | Permission checks, protected route lists         |
| `cache.ts`         | Small in-memory cache for loader data            |
| `dayjs.ts`         | Pre-configured dayjs instance                    |
| `logger.ts`        | Structured logging wrapper                       |
| `utils.ts`         | `cn()`, domain transforms, shared pure functions |


Keep functions **pure** where possible. Side effects belong in hooks, stores, or interceptors.

---

## Quick Checklist for New Features

1. Add types to `lib/types.ts` (and defaults to `lib/defaults.ts` if needed).
2. Create `hooks/apis/use-<feature>.tsx` with the factory pattern.
3. Add route file under `src/routes/` with `createFileRoute`.
4. Build page UI in `routes/.../components/`.
5. Extract reusable UI into `components/molecules/` only when used across routes.
6. Add Zustand store only if you need client-side state beyond URL/query cache.
7. Wrap listings in `DataTableProvider` if the page has search/sort/pagination.
8. Use `lazy()` for heavy imports from route files.

---

## Bootstrapping Another Project

To replicate this structure elsewhere:

1. Copy the `src/` folder layout and `tsconfig.json` path aliases.
2. Set up TanStack Router with the same `tsr.config.json` conventions (`~` prefix, `-` ignore).
3. Add `lib/api.ts`, `lib/types.ts`, `lib/constants.ts`, `lib/utils.ts` as foundations.
4. Establish `hooks/apis/` with one factory hook per API resource.
5. Add `components/ui/` via shadcn init (`components.json` aliases).
6. Wire providers in `components/providers/index.tsx` (Query, Theme, Router).
7. Enforce strict TypeScript + oxfmt/oxlint in CI.

This document reflects the conventions used in **anthra-labs**. Adapt names and domains, but keep the layering and patterns consistent.