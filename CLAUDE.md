# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript compiler without emitting files
- `npm run lint` - Run ESLint with zero warnings tolerance
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run check-all` - Run type-check + lint + format check (CI validation)
- `npm run fix-all` - Run format + lint fix (auto-fix all issues)
- `npm run deploy` - Full build with validation (check-all + build)

## Architecture

This is a React 19 + TypeScript + Vite application using modern tooling:

### UI Components
- **shadcn/ui components** configured in `components.json` with "new-york" style
- Components use **Radix UI primitives** with **class-variance-authority** for variants
- **Tailwind CSS** for styling with custom CSS variables
- Import alias `@/` points to `src/` directory

### Key Files
- `vite.config.ts` - Automatically sets base path from package.json name for GitHub Pages deployment
- `components.json` - shadcn/ui configuration for component generation
- Path aliases: `@/components`, `@/lib/utils`, `@/components/ui`

### Styling Patterns
- Use `cn()` utility from `@/lib/utils` for combining Tailwind classes
- Components follow shadcn/ui patterns with forwardRef and variant props
- Tailwind config includes custom CSS variables and animations

### Linting & Quality
- **ESLint 9** with flat config, TypeScript, React, and Tailwind rules
- **Prettier** for code formatting with Tailwind class sorting
- **Import ordering** enforced with alphabetical sorting and newlines between groups
- Vite checker plugin runs TypeScript and ESLint in development

### Authentication & Extension Integration
- **Browser Extension Integration** - Communicates with BodhiApp browser extension via `libbodhiext`
- **OAuth 2.0 + PKCE** - Secure authentication flow with Proof Key for Code Exchange
- **Token Management** - Access and refresh token handling in localStorage
- **ExtensionProvider** context provides unified access to extension and auth state
- **Auto-detection** - Extension availability detected on app load with retry logic

#### Key Authentication Components
- `useAuth()` hook - OAuth flow management (login, logout, token refresh)
- `useExtension()` hook - Extension detection and client communication
- `useAuthServer()` hook - Token exchange and validation with automatic refresh
- `useExtensionApi()` hook - Authenticated API requests with automatic token handling
- `ExtensionClient` class - Typed interface for extension communication
- Extension constants and configuration in `src/lib/extension-constants.ts`

#### Authentication Flow
- **Resource Access Request** - First requests resource scope from extension
- **OAuth Authorization** - Builds PKCE-secured auth URL and redirects to OAuth server
- **Token Exchange** - Exchanges authorization code for access/refresh tokens
- **Token Refresh** - Automatic token refresh when API requests fail with 401
- **State Management** - Real-time auth state updates via localStorage events

### Deployment
- Configured for **GitHub Pages** deployment
- Production base path automatically derived from package.json name
- SPA routing support via `public/404.html`