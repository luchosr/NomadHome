---
description: Frontend development standards, best practices, and conventions, including Vite configuration, state separation (TanStack Query + Zustand), Tailwind CSS + shadcn/ui styling, React Hook Form + Zod validation, and localized string helpers.
globs:
  [
    'apps/web/src/**/*.{ts,tsx}',
    'apps/web/e2e/**/*.{ts,js}',
    'apps/web/tsconfig.json',
    'apps/web/vite.config.ts',
    'apps/web/package.json',
    'apps/web/tailwind.config.js',
  ]
alwaysApply: true
---

# Frontend Project Configuration and Best Practices

## Table of Contents

- [Frontend Project Configuration and Best Practices](#frontend-project-configuration-and-best-practices)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Technology Stack](#technology-stack)
    - [Core Technologies](#core-technologies)
    - [UI \& Styling Framework](#ui--styling-framework)
    - [State Management \& Data Flow](#state-management--data-flow)
    - [Forms \& Validation](#forms--validation)
    - [Internationalization (i18n) MVP](#internationalization-i18n-mvp)
    - [Testing \& Tools](#testing--tools)
  - [Project Structure](#project-structure)
  - [Coding Standards](#coding-standards)
    - [Naming Conventions](#naming-conventions)
    - [Component Conventions](#component-conventions)
    - [State Separation Philosophy](#state-separation-philosophy)
      - [1. Server State (TanStack Query)](#1-server-state-tanstack-query)
      - [2. Global Client State (Zustand)](#2-global-client-state-zustand)
    - [Form Architecture](#form-architecture)
  - [UI/UX Standards](#uiux-standards)
    - [Tailwind CSS \& shadcn/ui Integration](#tailwind-css--shadcnui-integration)
    - [Localization \& Copy Access](#localization--copy-access)
  - [Testing Standards](#testing-standards)
  - [Configuration Standards](#configuration-standards)
    - [Path Mappings](#path-mappings)
  - [Performance Best Practices](#performance-best-practices)
  - [Development Workflow](#development-workflow)
    - [CLI Commands](#cli-commands)

---

## Overview

This document defines the architecture, coding standards, and engineering practices. Moving away from legacy configurations, this project leverages a high-performance build pipeline, utility-first styling, explicit state boundary separation, and strict runtime type validation.

## Technology Stack

### Core Technologies

- **React 18.3+**: Modern functional UI rendering using hooks.
- **Vite**: Ultra-fast next-generation frontend tooling and bundler.
- **TypeScript**: Strict compile-time static type safety.
- **React Router (v6+)**: Declarative, client-side application routing.

### UI & Styling Framework

- **Tailwind CSS**: Utility-first CSS framework for atomic layouts.
- **shadcn/ui**: Accessible, customizable component primitives built on top of Radix UI and styled via Tailwind.
- **Lucide React**: Clean, modern iconography companion library.

### State Management & Data Flow

- **TanStack Query (v5+)**: Dedicated asynchronous **server state** management (caching, data fetching, mutations, synchronization).
- **Zustand**: Lightweight, atomic **client state** management for global UI indicators, local preferences, and transient application states.

### Forms & Validation

- **React Hook Form**: Performance-focused, uncontrolled form hooks minimizing unnecessary re-renders.
- **Zod**: Declarative schema validation for runtime type enforcement and form error mapping.

### Internationalization (i18n) MVP

- **Thin `t(key)` Helper**: Light abstraction using an English-only lookup dictionary. Prepares the codebase for easy `i18next` integration post-MVP without bundle-size overhead today.

### Testing & Tools

- **Playwright**: End-to-End (E2E) feature verification for critical user flows (per [CLAUDE.md](../CLAUDE.md) §3).
- **Vitest**: Blazing-fast Vite-native unit and component testing runner.

---

## Project Structure

```
apps/web/
├── public/                 # Pure static assets (favicons, etc.)
├── src/
│   ├── assets/            # Global media assets (images, fonts)
│   ├── components/        # UI Layer
│   │   ├── ui/            # shadcn/ui low-level primitives (unmodified/installed)
│   │   └── shared/        # Reusable compound UI components (cards, tables)
│   ├── features/          # Domain-driven features (colocating queries, stores, pages)
│   │   └── listings/
│   │       ├── components/
│   │       ├── hooks/     # Feature-specific custom queries/mutations
│   │       ├── store.ts   # Feature-specific Zustand store (if needed)
│   │       └── pages/
│   ├── hooks/             # Global reusable utilities (useAuth, useDebounce)
│   ├── lib/               # Third-party configurations (api-client, shadcn utils)
│   ├── routes/            # React Router tree configuration
│   ├── App.tsx            # Main Application Shell & Context Providers
│   ├── index.css          # Global Tailwind directives and CSS variables
│   └── main.tsx           # Application Bootstrap entry point
├── e2e/                   # Playwright E2E Test Suite
├── tailwind.config.js     # Tailwind CSS theme configurations
├── tsconfig.json          # Strict TypeScript engine configuration
└── vite.config.ts         # Vite build and plugin architecture config

packages/shared/
└── src/
    └── strings/
        ├── en.ts           # MVP base English lookup table
        └── index.ts        # t(key) structural implementation (shared FE + BE)
```

> **Note**: user-facing copy lives in `packages/shared/src/strings/`, not under `apps/web/src/locales/`, so the same `t()` helper can be reused by `apps/api/` for transactional email subjects and similar copy.

---

## Coding Standards

### Naming Conventions

- **Component & File Naming**: Use PascalCase for React Components and their files (e.g., `ListingCard.tsx`, `HostDashboardShell.tsx`).
- **Hook Naming**: Prefix with `use`, utilizing camelCase (e.g., `useListingQuery`, `useUIStore`).
- **Validation Schemas**: Suffix with `Schema` using camelCase (e.g., `loginFormSchema`, `createListingSchema`).
- **Variables & Functions**: standard camelCase (e.g., `isSubmitting`, `onFilterChange`).
- **Constants**: Strict `UPPER_SNAKE_CASE` (e.g., `PAGINATION_LIMIT`, `DEBOUNCE_DELAY`).

---

### Component Conventions

- **Functional Syntax**: Write all components as functional array declarations or explicit `React.FC` standard definitions.
- **Props Typing**: Strongly type props using TypeScript `interface` or `type`. Always destructure properties inside the component arguments block.
- **Encapsulation**: If a sub-component is only ever used in one feature page, isolate it inside that feature block rather than placing it in global components.

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@nomadhome/shared/strings';

interface FeedbackBannerProps {
  status: 'success' | 'error';
  onActionClose: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ status, onActionClose }) => {
  return (
    <div className={`p-4 rounded-md ${status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
      <p className="text-sm font-medium">
        {status === 'success' ? t('banner.success_message') : t('banner.error_message')}
      </p>
      <Button onClick={onActionClose} variant="ghost" size="sm" className="mt-2">
        {t('common.close')}
      </Button>
    </div>
  );
};
```

---

### State Separation Philosophy

To optimize rendering speeds and simplify debugging pathways, states must reside within explicit domains:

#### 1. Server State (TanStack Query)

Any state originating from an external API endpoint must be managed via TanStack Query. **Do not** manually store fetched network data inside local `useState` or global Zustand hooks.

```typescript
// apps/web/src/features/listings/hooks/useListingsSearchQuery.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ListingSearchResultDTO, SearchListingsQuery } from '@nomadhome/shared/schemas/search';

const fetchListings = async (query: SearchListingsQuery): Promise<ListingSearchResultDTO[]> => {
  const { data } = await apiClient.get('/api/v1/listings/search', { params: query });
  return data.data;
};

export const useListingsSearchQuery = (query: SearchListingsQuery) => {
  return useQuery({
    queryKey: ['listings', 'search', query],
    queryFn: () => fetchListings(query),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 minute — short, since availability changes
  });
};
```

#### 2. Global Client State (Zustand)

Use Zustand exclusively for state synchronized across the UI that does not stem from a server database (e.g., sidebar toggles, theme settings, temporary filter parameters).

```typescript
// apps/web/src/features/search/store.ts
import { create } from 'zustand';

interface SearchUIState {
  filtersPanelOpen: boolean;
  toggleFiltersPanel: () => void;
}

export const useSearchUIStore = create<SearchUIState>((set) => ({
  filtersPanelOpen: false,
  toggleFiltersPanel: () =>
    set((state) => ({ filtersPanelOpen: !state.filtersPanelOpen })),
}));
```

> **What does NOT belong in Zustand**: the search filter values themselves (city, dates, price range) — those belong in the URL query string so results are shareable. Reach for Zustand only for ephemeral UI like "is the filter drawer open."

---

### Form Architecture

Forms must implement **React Hook Form** partnered with structural runtime parsing from **Zod**. This ensures standard programmatic constraint compilation before execution hand-offs.

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { t } from '@nomadhome/shared/strings';
// IMPORTANT: schemas come from packages/shared so backend and frontend validate against the same source of truth.
import { CreateListingSchema, type CreateListingPayload } from '@nomadhome/shared/schemas/listings';

export const ListingBasicsForm: React.FC<{
  onSubmit: (data: CreateListingPayload) => Promise<void>;
}> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateListingPayload>({
    resolver: zodResolver(CreateListingSchema),
    defaultValues: { title: '', city: '', nightlyRateCents: 0, capacity: 1 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <label className="text-sm font-medium">{t('listings.form.title')}</label>
        <Input {...register('title')} className="mt-1" />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">{t('listings.form.city')}</label>
        <Input {...register('city')} className="mt-1" />
        {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">{t('listings.form.nightlyRate')}</label>
        <Input type="number" {...register('nightlyRateCents', { valueAsNumber: true })} className="mt-1" />
        {errors.nightlyRateCents && <p className="text-xs text-destructive mt-1">{errors.nightlyRateCents.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
};
```

> **Cross-stack invariant**: `CreateListingSchema` is imported from `@nomadhome/shared`. The backend uses the same schema in [docs/backend-standards.md](backend-standards.md) §Validation Patterns. A schema change anywhere is a schema change everywhere — no drift possible.

---

## UI/UX Standards

### Tailwind CSS & shadcn/ui Integration

- **Composition Rules**: Build layouts primarily using Tailwind layout utilities (`flex`, `grid`, `gap`, `p-`, `m-`). Avoid hardcoding manual widths or explicit px styling heights unless completely inescapable.
- **Component Strategy**: Use `shadcn/ui` custom building blocks (`/components/ui`) as immutable dependency atoms. To vary presentation styling, override variables dynamically using the tailwind merging standard execution utility `cn(...)`.

```typescript
import { cn } from '@/lib/utils';

// Extending standard primitive styling smoothly via cn utility wrapper
<Button className={cn("w-full bg-indigo-600 hover:bg-indigo-700", customClassName)}>
  {t('common.submit')}
</Button>
```

### Localization & Copy Access

Hardcoded conversational text fragments are strictly prohibited anywhere inside functional markup interfaces. All copy variants must utilize the localization engine framework dictionary layout patterns.

```typescript
// packages/shared/src/strings/en.ts
export const en = {
  common: {
    save: 'Save',
    saving: 'Saving...',
    close: 'Close',
  },
  listings: {
    form: {
      title: 'Listing title',
      city: 'City',
      nightlyRate: 'Nightly rate (USD cents)',
    },
  },
  search: {
    empty: 'No listings match your search. Try widening the dates or removing filters.',
  },
  bookings: {
    notice: {
      listingDisabled: 'This listing has been disabled by NomadHome. Your booking remains valid; contact support for questions.',
    },
  },
} as const;

// packages/shared/src/strings/index.ts
import { en } from './en';

export type PathsToStringProps<T> = T extends string
  ? ''
  : {
      [K in Extract<keyof T, string>]: Dot<K, PathsToStringProps<T[K]>>;
    }[Extract<keyof T, string>];

type Dot<T extends string, U extends string> = U extends '' ? T : `${T}.${U}`;
type LocaleKeys = PathsToStringProps<typeof en>;

export const t = (key: LocaleKeys): string => {
  return (
    key
      .split('.')
      .reduce(
        (accumulator: any, currentKey) => accumulator?.[currentKey],
        en,
      ) || key
  );
};
```

---

## Testing Standards

- **E2E Integration Verification (Playwright)**: Prioritize testing broad user workflows rather than component methods. Add descriptive `data-testid` variables inside input sections to isolate elements clearly. Specs live under `apps/web/e2e/<change-id>.spec.ts`.
- **Unit Mechanics (Vitest)**: Target utility calculations, data mutation helpers, string transformers, and schema parameters inside individual `.test.ts` setups.

---

## Configuration Standards

### Path Mappings

Imports use clean semantic shortcuts starting from the application core root workspace path alias pointer syntax definitions:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## Performance Best Practices

1.  **Lazy Loading**: Split heavy workspace code views using `React.lazy()` alongside layout boundary placeholders (`Suspense`) at the router level.
2.  **Stale Query Controls**: Finetune TanStack Query parameters (`staleTime`, `gcTime`) carefully to avoid unnecessary network polling overheads.
3.  **Atomic State Triggers**: Select specific state paths out of Zustand global definitions (`useSearchUIStore(state => state.filtersPanelOpen)`) to protect external structures from global rendering recalculation updates.

---

## Development Workflow

### CLI Commands

```bash
pnpm dev             # Boots local Vite processing engine instance
pnpm build           # Transpiles production distribution package targets
pnpm lint            # Activates comprehensive ESLint verification checks
pnpm preview         # Serves static production local production builds
pnpm test            # Vitest unit/component runner
pnpm test:e2e        # Playwright headless run
```
