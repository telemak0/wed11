# Copilot Instructions

## Project Overview

**Wed11** is a static website for managing amateur football game lineups, tracking statistics, and recording match results. Hosted on GitHub Pages with no backend server—all logic runs client-side.

- **Technology Stack**: TypeScript 5.x, Vite, HTML/CSS, vanilla JavaScript, FireStore (Firebase), GitHub Pages
- **Primary Users**: Amateur football team administrator (account/lineup management) and public viewers (lineup display)
- **Key Architecture**: Vite build, MVC + Observer pattern, FireStore (Firebase) persistence, localStorage backup, static asset deployment
- **Critical Constraint**: No backend server; all logic runs client-side; < 500KB gzipped bundle

## Constitutional Framework

This project is governed by the **Wed11 Constitution** (`.ai/kb/constitution.md`). Before coding, understand these 4 core principles:

1. **Code Quality & Type Safety**: TypeScript `strict: true`, explicit types everywhere, no `any` without justification, ESLint + Prettier
2. **Test-Driven Development**: RED-GREEN-REFACTOR mandatory; 80%+ coverage on critical paths; Vitest + integration tests
3. **User Experience Consistency**: Component library enforced; single source of truth for state; WCAG 2.1 AA accessibility minimum
4. **Performance & Bundle Optimization**: Bundle < 500KB gzipped; TTI < 2s on 3G; code splitting for admin vs. public frontend

**All PRs MUST reference which principles they satisfy.** Non-compliance blocks merge.

## Development Workflow

### Agentic tool usage

You as an assistant have a set of tools at your disposal to help you understand the codebase and the project. 
You MUST use this tools to solve these kind of queries and you MUST prioritize using the Remembrances tools as they are specific for this purpose and project.
You MUST look for information in the codebase and in the Knowledge base before asuming there's no information about a topic.
These are some IMPORTANT guidelines regarding the use of these tools:

- All references in the user instructions to search, find or locate elements in the code must be resolved using the Remembrances code tools, PRIORITIZING its hybrid search.
- All references to kb refer to Knowledge Base, a folder with markdown files that document the project that can be easily accessed using Remembrances kb tools.
- All references in the user instructions to store, record or remember implementations, relevance documentation, memories or knowledge must be resolved using the Remmebrances kb tools. 
- All references in the user instructions regarding to short, quick notes or memories to store for future (usually close in time) reference are nicknamed facts and must be resolved using the Remembrances facts tools.
- If Remembrances tool is not providing you the information you're looking for or if you need additional information on an specific tool from the Remembrances tool set, use the tool `how_to_use` to learn about it's purpose and usage examples.

The current project ID in Remembrances is `home_nahun_test_proyects_wed11`.

### Getting Started
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server with HMR
npm run build                  # Create production bundle
npm test                       # Run all tests (unit + integration)
npm run lint                   # Check code style (ESLint)
npm run format                 # Auto-format code (Prettier)
```

### Quality Gates (Mandatory Before Merge)
```bash
# All of these must pass:
npm test                       # Tests pass
npm run lint                   # No linting errors
npm run format --check         # Code is formatted
npm run build                  # TypeScript compiles without errors
npm run bundle-report          # Bundle size < 500KB gzipped (analyze with webpack-bundle-analyzer)
```

## Code Conventions

### Project Structure
```
src/
├── components/               # Reusable UI components (all use component library)
├── pages/                    # Page-level components (admin routes, public views)
├── stores/                   # State management (Redux/Zustand store definitions)
├── services/                 # Business logic (calculations, data transformations)
├── types/                    # Shared TypeScript interfaces & types
├── utils/                    # Pure utility functions
└── main.ts                   # Application entry point

tests/
├── unit/                     # Unit tests for services, utils, stores
├── integration/              # Integration tests for user workflows
├── components/               # Component tests (rendering, events)
└── fixtures/                 # Mock data, test utilities

dist/                         # Build output (deployed to gh-pages)
.github/actions/              # CI/CD workflow for automated builds & deploys
```

### Naming Conventions
- **Files**: kebab-case (e.g., `user-card.tsx`, `auth-service.ts`)
- **Functions/Methods**: camelCase (e.g., `createLineup()`, `isValidEmail()`)
- **Classes/Components**: PascalCase (e.g., `UserCard`, `AuthService`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_BUNDLE_SIZE`, `STORAGE_KEY_ADMIN`)
- **Interfaces**: PascalCase, optionally prefixed (e.g., `IUser`, `AdminState` or `User`)
- **Test files**: `[name].test.ts` or `[name].spec.ts`

### Key Patterns

**Type Safety**:
```typescript
// ✅ DO: Explicit types everywhere
interface Lineup {
  id: string;
  teams: Team[];
  createdAt: Date;
}

const createLineup = (teams: Team[]): Lineup => { ... }

// ❌ DON'T: Avoid any
const data: any = fetch(...);  // Bad!
```

**State Management** (single source of truth):
```typescript
// Use Redux/Zustand/Context consistently across the app
// All mutable state goes through a centralized store
// localStorage sync happens in store middleware
```

**localStorage Data Model** (with versioning):
```typescript
interface StorageSchema {
  version: 1;  // Schema version for migrations
  accounts: Record<string, Account>;
  lineups: Lineup[];
  stats: Stats;
}
```

**Form Validation** (immediate feedback):
```typescript
// All forms validate on change, show inline errors
// Submit button disabled until form is valid
// Clear error messages for users
```

**Component API** (props-driven):
```typescript
// All components accept props and emit events
// No component-level side effects (use stores)
// Testable in isolation
```

## Critical Files & Domains

- `.ai/kb/constitution.md` — Governance and principles (source of truth)
- `tsconfig.json` — MUST have `"strict": true` and `"noImplicitAny": true`
- `src/stores/` — State management (admin accounts, lineups, stats)
- `src/pages/admin.tsx` — Admin UI (create accounts, manage lineups, record results)
- `src/pages/public.tsx` — Public UI (display current lineups to players)
- `tests/integration/` — User workflows (login, lineup creation, result submission)

## Testing Approach

**TDD Optional for key features**:
1. Write failing test (RED)
2. User approval on test description
3. Implement until test passes (GREEN)
4. Refactor, ensure test still passes

**Test Organization**:
- **Unit tests**: Pure functions, calculations, utilities
- **Integration tests**: User workflows (admin creates account → creates lineup → users view it)
- **Component tests**: Rendering, prop handling, user interactions
- **E2E tests**: Critical paths (full admin workflow, data persistence across page reload)

**Coverage Requirements**:
- Critical paths (auth, data persistence): minimum 80%
- Utilities & stores: aim for 90%+
- UI components: 60%+ (focus on logic, not snapshot tests)

**Example**:
```typescript
// tests/integration/admin-workflow.test.ts
describe("Admin creates and records game result", () => {
  it("displays final score after admin submits result", async () => {
    // Given: admin has created a lineup
    // When: admin submits game result
    // Then: public page shows updated stats and score
  });
});
```

## Performance & Bundle Requirements

**Hard Targets**:
- **Bundle size**: < 500KB gzipped (JavaScript + CSS combined)
- **Time to Interactive**: < 2 seconds on 3G (Lighthouse 4G throttling)
- **Images**: WebP with PNG fallback, lazy-load, responsive sizes

**Build Optimization**:
- Tree-shaking: enabled by default in modern bundlers
- Code splitting: admin interface separate from public frontend
- CSS purging: remove unused styles (Tailwind/PostCSS)
- No unused dependencies—audit quarterly with `npm audit`

**Monitor**:
```bash
# Check bundle size after each build
npm run bundle-report

# Lighthouse score (target: 90+ on all metrics)
npx lighthouse https://<username>.github.io/wed11
```

## Common Gotchas

1. **localStorage is synchronous & limited**: No async/await; ~5-10MB limit. Plan data schema carefully.
2. **No server logs**: All errors surface to users. Use client-side error boundaries and user feedback forms.
3. **CORS constraints**: External APIs must allow cross-origin requests from `github.io` domain.
4. **Mobile performance**: Test on real 3G/4G (not desktop throttling). Users at the stadium depend on it.
5. **Accessibility matters**: WCAG 2.1 AA is non-negotiable. Keyboard navigation, ARIA labels, color contrast.
6. **Git history is your debugger**: No commented-out code; use git blame and commits to trace changes.
7. **GitHub Pages caching**: Build outputs cached aggressively. Use cache busting or version hashes in asset names.

## Anti-Patterns to Avoid

- ❌ Storing large objects in localStorage without schema versioning
- ❌ UI state mixed with data state (use a store)
- ❌ Hardcoding data; use environment files for configuration
- ❌ Skipping tests to "move faster" (you'll regress)
- ❌ Unused imports or commented code (clean it up)
- ❌ Components with side effects (fetch, localStorage calls) — move to stores/services
- ❌ Breaking accessibility for speed (keyboard nav, ARIA labels are non-negotiable)
