# Testing Guide for Pre-Wedding Look App

This document provides comprehensive information about the testing infrastructure implemented for the pre-wedding-look application.

## Overview

The testing infrastructure includes:
- **Track A**: E2E Testing with Playwright and CI Pipeline
- **Track B**: Credits System with Stripe Integration
- Complete CI/CD pipeline with GitHub Actions
- Performance monitoring with Lighthouse
- Visual regression testing

## Testing Stack

### E2E Testing
- **Playwright**: Cross-browser testing (Chrome, Firefox, Safari)
- **Test Coverage**: Game flow, payments, UI interactions
- **Visual Testing**: Screenshot comparisons for layouts
- **Mobile & Desktop**: Responsive design testing

### Unit Testing
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing
- **Coverage Reports**: Automated coverage tracking

### Performance Testing
- **Lighthouse CI**: Performance, accessibility, and SEO auditing
- **Bundle Analysis**: Build size monitoring
- **Core Web Vitals**: Performance metrics tracking

### Security Testing
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Advanced security analysis
- **Static Analysis**: Code quality and security checks

## Credits System & Payments

### Database Schema
The credits system includes:
- `user_credit_wallets`: User balance tracking
- `credit_transactions`: Complete transaction ledger
- `credit_plans`: Available purchase plans
- `promo_codes`: Promotional code system
- `user_referrals`: Referral bonus tracking

### Stripe Integration
- Secure payment processing
- Webhook handling for payment completion
- Automatic credit allocation
- Promo code redemption
- Real-time balance updates

### Key Features
- Credit purchase with Stripe Checkout
- Promo code redemption system
- Transaction history tracking
- Referral bonuses
- Credit spending for reel generation

## File Structure

```
pre-wedding-look/
├── .github/workflows/
│   └── ci.yml                    # GitHub Actions CI pipeline
├── api/
│   ├── stripe-webhook.ts         # Stripe webhook handler
│   ├── create-checkout-session.ts
│   ├── credit-balance.ts
│   ├── credit-plans.ts
│   ├── spend-credits.ts
│   └── redeem-promo.ts
├── src/
│   ├── components/
│   │   ├── CreditsDisplay.tsx    # Credits header component
│   │   └── PurchaseModal.tsx     # Credits purchase modal
│   ├── hooks/
│   │   └── useCredits.ts         # Credits management hook
│   └── services/
│       └── stripeService.ts      # Stripe integration service
├── scripts/
│   └── seed-test-data.ts         # Test data seeding script
├── supabase/migrations/
│   └── 011_credits_system.sql    # Credits database schema
├── tests/
│   ├── e2e/
│   │   ├── global.setup.ts       # Test setup and data seeding
│   │   ├── global.teardown.ts    # Test cleanup
│   │   ├── blind-date-game.spec.ts  # Game flow tests
│   │   └── visual-regression.spec.ts # Visual tests
│   └── assets/                   # Test images and assets
├── playwright.config.ts          # Playwright configuration
├── .lighthouserc.json            # Lighthouse CI config
└── .eslintrc.json               # ESLint configuration
```

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install

# Set up environment variables
cp .env.example .env.local
# Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
```

### Unit Tests
```bash
# Run unit tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Seed test data
npm run test:seed

# Run all E2E tests
npm run test:e2e

# Run with browser UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Clean test data
npm run test:clean
```

### Performance Tests
```bash
# Run Lighthouse audit
npm run lighthouse

# Start dev server and run lighthouse
npm run dev &
npx lhci autorun
```

### Linting
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Test Data

### Test Users
The seeding script creates test users:
- `test1@prewedding.app` / `TestPass123!` (100 credits)
- `test2@prewedding.app` / `TestPass123!` (100 credits)
- `admin@prewedding.app` / `AdminPass123!` (1000 credits, admin role)

### Test Rooms
Pre-created game rooms:
- `TEST01`: 2 players, 3 rounds
- `TEST02`: 4 players, 3 rounds  
- `DEMO99`: 2 players, 1 round (quick testing)

### Test Promo Codes
Available promo codes:
- `TEST50`: 50 credits (100 uses)
- `WELCOME25`: 25 credits (unlimited)
- `E2ETEST`: 100 credits (10 uses)

## CI Pipeline

The GitHub Actions pipeline includes:

### 1. Unit Tests & Linting
- TypeScript type checking
- ESLint code quality checks
- Vitest unit tests
- Coverage reporting

### 2. Build Verification
- Production build testing
- Bundle size analysis
- Build artifact generation

### 3. E2E Testing
- Multi-browser testing (Chrome, Firefox, Safari)
- Test data seeding
- Game flow testing
- Payment flow testing
- Visual regression testing

### 4. Performance Testing
- Lighthouse audits
- Performance score requirements:
  - Performance: ≥90
  - Accessibility: ≥95
  - Best Practices: ≥90
  - SEO: ≥80

### 5. Security Scanning
- Dependency vulnerability checks
- Security best practices validation

### 6. Deployment
- Preview deployments for PRs
- Production deployment on main branch merge
- Automatic rollback on test failures

## Environment Variables

### Required for Testing
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe (use test keys)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Deployment
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
VERCEL_TOKEN=your_vercel_token
```

## Test Scenarios

### Game Flow Tests
1. **Quick Match Flow**:
   - Navigate to Blind Date tab
   - Start quick match
   - Complete 3 rounds of styling
   - View reveal results
   - Cast votes
   - Download reel

2. **Room Management**:
   - Create multiplayer room
   - Join room with code
   - Handle room capacity limits
   - Room not found errors

3. **Credits Integration**:
   - Check credits display
   - Redeem promo codes
   - Handle insufficient credits
   - Purchase credits flow

### Visual Regression Tests
1. **Reveal Layouts**:
   - Desktop reveal interface
   - Mobile reveal interface
   - Voting interface across devices

2. **Modal Layouts**:
   - Credits purchase modal
   - Promo code interface
   - Error states

3. **Loading States**:
   - Game matching interface
   - Processing indicators
   - Error message displays

### Performance Requirements
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 4s
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 500ms
- Time to Interactive: < 5s

## Troubleshooting

### Test Failures
1. **Database Connection Issues**:
   - Verify Supabase credentials
   - Check test database access
   - Run test:clean to reset data

2. **Browser Issues**:
   - Reinstall Playwright browsers
   - Clear browser cache
   - Check headless vs headed mode

3. **Timing Issues**:
   - Increase timeout values
   - Add explicit wait conditions
   - Use networkidle state

### Performance Issues
1. **Lighthouse Failures**:
   - Check bundle size limits
   - Optimize images and assets
   - Review loading strategies

2. **Visual Regression Failures**:
   - Update screenshots if intentional
   - Check viewport differences
   - Disable animations in tests

## Contributing

When adding new tests:

1. **E2E Tests**:
   - Add to appropriate spec file
   - Use data-testid attributes
   - Include error state testing
   - Add visual snapshots for new UI

2. **Unit Tests**:
   - Test components in isolation
   - Mock external dependencies
   - Achieve >80% code coverage

3. **Performance**:
   - Monitor bundle size impact
   - Test new features on mobile
   - Update Lighthouse assertions

## Monitoring

### Production Monitoring
- Real-time performance tracking
- Error monitoring with Sentry
- User analytics and conversion tracking
- Payment processing monitoring

### CI/CD Monitoring
- Build success rates
- Test execution times  
- Deploy frequency and success
- Performance regression tracking

This testing infrastructure ensures reliable, performant, and secure deployments of the pre-wedding-look application.