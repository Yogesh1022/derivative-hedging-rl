# Testing Guide for HedgeAI Trading Platform

## 📋 Overview

This document provides comprehensive information about testing infrastructure and practices across the HedgeAI Trading Platform.

## 🧪 Test Coverage Status

| Component | Framework | Coverage | Status |
|-----------|-----------|----------|--------|
| **Backend** | Jest + Supertest | 70%+ | ✅ Ready |
| **Frontend** | Vitest + React Testing Library | 70%+ | ✅ Ready |
| **E2E** | Playwright | Key flows | ✅ Ready |

---

## 🎯 Backend Testing (Node.js + TypeScript)

### Setup

The backend uses **Jest** with **Supertest** for API testing.

**Configuration:** `backend/jest.config.js`

### Running Tests

```bash
cd backend

# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run in CI mode
npm run test:ci
```

### Test Structure

```
backend/src/
├── __tests__/
│   ├── controllers/
│   │   ├── auth.controller.test.ts
│   │   ├── portfolio.controller.test.ts
│   │   └── trade.controller.test.ts
│   ├── services/
│   │   └── auth.service.test.ts
│   └── middleware/
│       └── auth.middleware.test.ts
└── test/
    └── setup.ts
```

### Test Examples

**Controller Test:**
```typescript
import request from 'supertest';
import app from '../../app';

describe('Auth Controller', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

**Service Test:**
```typescript
import { AuthService } from '../../services/auth.service';

describe('AuthService', () => {
  it('should hash password on registration', async () => {
    const result = await AuthService.register(
      'test@example.com',
      'password123',
      'Test User'
    );

    expect(result.user.password).not.toBe('password123');
  });
});
```

### Coverage Goals

- **Controllers:** 80%+
- **Services:** 85%+
- **Middleware:** 90%+
- **Overall:** 80%+

---

## ⚛️ Frontend Testing (React + TypeScript)

### Setup

The frontend uses **Vitest** with **React Testing Library**.

**Configuration:** `frontend/vitest.config.ts`

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Test Structure

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   └── common/
│   │       ├── Button.test.jsx
│   │       └── Card.test.jsx
│   └── services/
│       ├── authService.test.js
│       └── portfolioService.test.js
└── test/
    └── setup.ts
```

### Test Examples

**Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../components/common/Button';

describe('Button Component', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Service Test:**
```typescript
import { authService } from '../../../services/authService';
import apiClient from '../../../services/api';

vi.mock('../../../services/api');

describe('AuthService', () => {
  it('should store tokens on login', async () => {
    apiClient.post.mockResolvedValue({
      data: { data: { token: 'test-token' } }
    });

    await authService.login('user@example.com', 'password');

    expect(localStorage.getItem('hedgeai_token')).toBe('test-token');
  });
});
```

### Coverage Goals

- **Components:** 70%+
- **Services:** 80%+
- **Hooks:** 75%+
- **Overall:** 70%+

---

## 🎭 E2E Testing (Playwright)

### Setup

The E2E tests use **Playwright** for cross-browser testing.

**Configuration:** `frontend/playwright.config.ts`

### Running Tests

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in specific browser
npx playwright test --project=chromium
```

### Test Structure

```
frontend/e2e/
├── auth.spec.ts
├── dashboard.spec.ts
└── trading.spec.ts
```

### Test Examples

**Authentication Flow:**
```typescript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');
  
  await expect(page).toHaveURL(/dashboard/);
});
```

**Trading Flow:**
```typescript
test('should create a trade order', async ({ page }) => {
  await page.goto('/trading');
  
  await page.selectOption('select[name="symbol"]', 'AAPL');
  await page.fill('input[name="quantity"]', '10');
  await page.click('button:has-text("Buy")');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Browsers Tested

- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit/Safari (Desktop)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

---

## 📊 Test Coverage Reports

### Viewing Coverage

**Backend:**
```bash
cd backend
npm run test:coverage
# Open coverage/lcov-report/index.html
```

**Frontend:**
```bash
cd frontend
npm run test:coverage
# Open coverage/index.html
```

### Coverage Thresholds

Tests will fail if coverage drops below:
- **Statements:** 70%
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 80%

---

## 🔧 Best Practices

### 1. Test Naming
```typescript
// ✅ Good
describe('AuthService', () => {
  it('should throw error when email is invalid', () => {})
})

// ❌ Bad
describe('Auth', () => {
  it('works', () => {})
})
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should update user profile', async () => {
  // Arrange
  const userId = '123'
  const updates = { name: 'New Name' }
  
  // Act
  const result = await userService.update(userId, updates)
  
  // Assert
  expect(result.name).toBe('New Name')
})
```

### 3. Mock External Dependencies
```typescript
jest.mock('../../services/api')
jest.mock('@prisma/client')
```

### 4. Clean Up After Tests
```typescript
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})
```

### 5. Test User Interactions
```typescript
// Use fireEvent for simple interactions
fireEvent.click(button)

// Use userEvent for realistic interactions
await userEvent.type(input, 'text')
```

---

## 🚀 CI/CD Integration

Tests are automatically run in GitHub Actions on every push and pull request.

**Workflow:** `.github/workflows/ci.yml`

### CI Test Commands
```yaml
# Backend tests
- run: cd backend && npm test

# Frontend tests
- run: cd frontend && npm run test:coverage

# E2E tests
- run: cd frontend && npm run test:e2e
```

---

## 📝 Adding New Tests

### Backend Controller Test Template

```typescript
// backend/src/__tests__/controllers/example.controller.test.ts
import request from 'supertest'
import app from '../../app'
import prisma from '../../config/database'

jest.mock('../../config/database')

describe('Example Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/example', () => {
    it('should return data', async () => {
      const mockData = { id: '1', name: 'Test' }
      ;(prisma.example.findMany as jest.Mock).mockResolvedValue([mockData])

      const response = await request(app)
        .get('/api/example')
        .set('Authorization', 'Bearer mock-token')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([mockData])
    })
  })
})
```

### Frontend Component Test Template

```typescript
// frontend/src/__tests__/components/Example.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Example } from '../../../components/Example'

describe('Example Component', () => {
  it('should render correctly', () => {
    render(<Example title="Test" />)
    
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Example onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### E2E Test Template

```typescript
// frontend/e2e/example.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Example Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should perform action', async ({ page }) => {
    await page.click('button#example')
    
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Tests timeout
```bash
# Increase timeout in jest.config.js
testTimeout: 15000
```

**Issue:** Mock not working
```bash
# Clear jest cache
npx jest --clearCache
```

**Issue:** Playwright browser not found
```bash
# Reinstall browsers
npx playwright install
```

**Issue:** Coverage not generated
```bash
# Ensure coverage directory exists
mkdir -p coverage
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

## ✅ Test Checklist

Before merging code, ensure:

- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Coverage thresholds are met
- [ ] E2E tests pass for critical flows
- [ ] No console errors in tests
- [ ] Tests are documented

---

**Last Updated:** March 6, 2026  
**Maintained by:** HedgeAI Development Team
