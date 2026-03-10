# CLAUDE.md — Worshpr Project Rules

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + ShadCN UI
- **ORM**: Prisma (PostgreSQL via Neon)
- **Data Fetching**: Axios + TanStack Query (React Query)
- **Auth**: NextAuth.js v4 (Credentials provider, JWT sessions)
- **Toasts**: Sonner

## Project Structure

```
src/
├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/       # Auth pages (login, register)
│   ├── (dashboard)/  # Protected pages
│   └── api/          # API Route Handlers
├── components/
│   ├── ui/           # ShadCN auto-generated (do NOT edit)
│   ├── common/       # Shared reusable components
│   └── [feature]/    # Feature-scoped components
├── hooks/            # Custom React hooks
├── lib/              # Prisma client, Axios instance, utils, constants
├── providers/        # React context/query providers
├── services/         # API call functions (used by React Query)
├── types/            # Global TypeScript types and interfaces
├── validations/      # Zod schemas
└── middleware.ts     # NextAuth middleware
prisma/
└── schema.prisma
```

## TypeScript

- Strict mode — no `any`, no untyped props.
- Define types in `src/types/`. Prefer `interface` for object shapes, `type` for unions/intersections.
- Use `z.infer<typeof schema>` to derive types from Zod schemas.
- Never cast with `as` unless absolutely necessary (explain with a comment if used).

## Code Style

- **Named exports** for everything except Next.js pages/layouts (those use default exports).
- Keep components small and single-responsibility (~150 lines max, split if exceeded).
- No inline logic in JSX — extract handlers, conditionals, and derived values above `return`.
- Import order: React → Next → third-party → internal (`@/`) → relative → types.
- Use absolute imports via `@/` alias for everything inside `src/`.

## Naming Conventions

- **Components**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUserData.ts`)
- **Services**: camelCase with `.service.ts` suffix (`user.service.ts`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse<T>`)
- **API routes**: kebab-case folders (`api/user-profile/route.ts`)
- **Zod schemas**: camelCase with `Schema` suffix (`loginSchema`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)

## Component Rules

- Use `FC<Props>` pattern with typed props interface.
- Always use `cn()` from `lib/utils.ts` for conditional Tailwind classes.
- Never hardcode colors or spacing — use Tailwind tokens only.
- Use ShadCN components from `components/ui/` as the base. Wrap in `components/common/` to extend globally.
- Component file structure: Imports → Types → Constants → Component → Subcomponents → Export.

## Data Fetching

- One Axios instance in `lib/axios.ts` — never create additional instances.
- Service files in `services/` map to one resource/domain each. Functions return typed Promises (never `any`).
- Use `useQuery` for reads, `useMutation` for writes. Invalidate related queries after mutations.
- Handle `isLoading`, `isError`, and empty states explicitly — never assume data exists.
- Don't `fetch()` directly inside components — use services + React Query hooks.

## API Route Rules

- Route files only handle HTTP methods — no business logic inside `route.ts`.
- All business logic lives in dedicated server-side service functions.
- Validate request bodies with Zod before processing.
- Consistent response shapes: `{ data: result }` for success, `{ error: message }` for errors.

## Prisma

- Always import from `@/lib/prisma` — never instantiate `PrismaClient` elsewhere.
- Never expose Prisma models directly to the client — map to plain types in the service layer.
- Use `select` and `include` deliberately — never return full documents with unneeded fields.
- Schema changes: use `prisma migrate dev --name <name>` locally, never `db push` for tracked schemas.
- Production builds: `prisma migrate deploy && prisma generate && next build`.

## Authentication

- Auth config lives in `lib/auth.ts` — never put auth logic directly in API route files.
- Server-side: `getServerSession(authOptions)` to access session.
- Client-side: `useSession()` hook — guard against `unauthenticated` status.
- Middleware protects all routes except auth and static assets. Add public routes to the matcher negative lookahead.
- NextAuth types extended in `src/types/next-auth.d.ts` for `id` and `role`.

## Styling

- Tailwind only — no inline `style={{}}` except for dynamic values that can't be expressed as classes.
- Mobile-first responsive design using `sm:`, `md:`, `lg:` breakpoints.
- Dark mode via `dark:` variant.
- Class order: layout → spacing → typography → color → interactive.

## Error Handling

- `try/catch` in all async functions (server and client).
- Never swallow errors silently — log or surface to user.
- Use Sonner for toast notifications: `toast.success()`, `toast.warning()`, `toast.error()`.

## Environment Variables

- Server-only secrets: no `NEXT_PUBLIC_` prefix.
- Client-accessible values: must use `NEXT_PUBLIC_` prefix.
- Maintain `.env.example` with placeholder values. Never commit `.env`.

## Do's and Don'ts

- Use Server Components by default; only add `"use client"` when interactivity or browser APIs are needed.
- Keep API routes thin — logic belongs in service functions.
- Use Zod for all input validation (forms + API).
- Don't put business logic inside route handlers.
- Don't mix server and client concerns in the same file.
- Don't leave unused imports, `console.log`s, or commented-out code.
