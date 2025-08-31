# Modern Fullstack Boilerplate

A clean, production-ready fullstack boilerplate with authentication, built with Next.js 15, React 19, and Convex.

## Features

- **🚀 Modern Stack**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **🔐 Authentication**: Convex + Better Auth with modal-based flow
- **📱 Responsive**: Mobile-first design with dark mode support  
- **🧪 Testing**: Playwright E2E tests with minimal configuration
- **⚡ Performance**: Turbopack, optimized builds, fast development
- **🎨 UI Components**: Shadcn/ui + Radix UI primitives

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your Convex deployment URL and site URL

# Run development server
pnpm dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── api/            # API routes  
│   ├── dashboard/      # Protected dashboard
│   └── page.tsx       # Landing page with modal auth
├── components/
│   ├── auth/          # Authentication components
│   └── ui/           # Reusable UI components
└── lib/              # Utilities and configurations

tests/
├── auth-flow.spec.ts  # E2E authentication tests
└── utils/            # Test helpers
```

## Scripts

```bash
pnpm dev         # Start development server
pnpm build       # Build for production  
pnpm start       # Start production server
pnpm lint        # Run ESLint
pnpm type-check  # TypeScript checking
pnpm test        # Run Playwright tests
pnpm test:ui     # Interactive test runner
```

## Authentication Flow

**Minimalist Design**: Landing page → Modal auth → Dashboard

- **Landing Page**: Hero with "Get Started" and "Sign In" buttons
- **Modal Authentication**: Seamless signup/signin without page navigation
- **Protected Routes**: Dashboard accessible only after authentication
- **Session Management**: Persistent authentication across browser sessions

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (serverless database + functions)  
- **Authentication**: Better Auth + Convex integration
- **UI Components**: Shadcn/ui + Radix UI
- **Testing**: Playwright E2E tests
- **Deployment**: Vercel (recommended)

## Environment Variables

```bash
# Required for Convex
CONVEX_DEPLOYMENT=your-deployment-id
CONVEX_SITE_URL=https://your-site-url
```

## Development

The project uses **pnpm** for package management and modern tooling:

- **Turbopack** for fast development builds
- **ESLint + Prettier** for code quality  
- **Playwright** for E2E testing
- **GitHub Actions** for CI/CD

## Testing

Run the authentication flow tests:

```bash
# Run all tests
pnpm test

# Interactive test runner  
pnpm test:ui

# Specific browser
pnpm exec playwright test --project=chromium
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT