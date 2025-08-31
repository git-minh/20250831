# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**
```bash
pnpm dev         # Start development server with Turbopack
pnpm build       # Build for production
pnpm start       # Start production server
pnpm lint        # Run ESLint with auto-fix
pnpm type-check  # TypeScript checking
```

**Testing:**
```bash
pnpm test        # Run all Playwright tests
pnpm test:ui     # Interactive test runner
pnpm exec playwright test --project=chromium  # Single browser
pnpm exec playwright test tests/auth-flow.spec.ts  # Single test file
```

**Convex (Backend):**
```bash
npx convex dev   # Start Convex development server
npx convex deploy  # Deploy to production
npx convex dashboard  # Open admin dashboard
```

## Architecture Overview

### Authentication System
- **Stack**: Convex + Better Auth integration via `@convex-dev/better-auth`
- **Flow**: Landing page → Modal auth → Dashboard (no page redirects)
- **Key Files**:
  - `convex/auth.ts` - Server-side auth functions and user lifecycle hooks
  - `src/lib/auth-client.ts` - Client-side auth instance
  - `src/components/convex-client-provider.tsx` - React provider wrapper

### Data Layer (Convex)
- **Schema** (`convex/schema.ts`): 
  - `userPreferences` - User settings linked to Better Auth users
  - `tasks` - Example user-specific data
  - `posts` - Example content with author references
- **Auth Integration**: Better Auth manages user tables; app extends with custom data via `userId` string references
- **Generated Files**: `convex/_generated/` contains auto-generated API types and functions

### Frontend Architecture  
- **Landing Page** (`src/app/page.tsx`): Modal-based auth overlay using `useState` for UX
- **Auth Components**: `SigninForm`/`SignupForm` in `src/components/auth/` with success callbacks
- **State Management**: Convex React hooks (`Authenticated`, `Unauthenticated`, `AuthLoading`) for auth-aware UI
- **Dashboard**: Protected route in `src/app/dashboard/` with sidebar navigation

### UI System
- **Components**: Shadcn/ui components in `src/components/ui/` (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Layout**: App uses sidebar navigation pattern with responsive mobile drawer

### Testing Architecture
- **E2E Testing**: Single focused test file `tests/auth-flow.spec.ts` covering modal auth flow
- **Config**: `playwright.config.minimal.ts` for simple CI-friendly testing
- **Helpers**: `tests/utils/` contains auth helpers and test data generators

## Key Patterns

### Authentication Flow
1. User lands on homepage with `<Unauthenticated>` wrapper
2. "Get Started" or "Sign In" opens modal (`showAuth` state)
3. Forms use `authClient.signUp.email()` / `authClient.signIn.email()` 
4. Success callback closes modal and redirects to `/dashboard`
5. `<Authenticated>` wrapper shows protected content

### Data Access Pattern
```typescript
// In Convex functions, get current user:
const user = await betterAuthComponent.getAuthUser(ctx);
if (!user) return null;

// Query user's data:
const userTasks = await ctx.db
  .query("tasks")
  .filter(q => q.eq(q.field("userId"), user.userId))
  .collect();
```

### Environment Setup
- Requires `CONVEX_DEPLOYMENT` and `CONVEX_SITE_URL` in `.env.local`
- Better Auth config in `convex/auth.config.ts` uses `CONVEX_SITE_URL`
- Client connects via `NEXT_PUBLIC_CONVEX_URL` environment variable

## Development Notes

- **pnpm**: Project uses pnpm for package management, not npm/yarn
- **Modal Auth**: Avoid creating separate auth pages; extend modal pattern
- **User Data**: Always link custom tables to Better Auth users via `userId` string field
- **Testing**: Single comprehensive test covers full auth flow; extend `auth-flow.spec.ts` for new scenarios
- **CI/CD**: GitHub Actions simplified for single-browser testing; uses pnpm cache