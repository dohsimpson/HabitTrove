# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HabitTrove is a gamified habit tracking PWA built with Next.js 15, TypeScript, and Jotai state management. Users earn coins for completing habits and can redeem them for rewards. Features multi-user support with admin capabilities and shared ownership of habits/wishlist items.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run setup:dev` - Full setup: installs bun, dependencies, runs typecheck and lint
- `npm install --force` - Install dependencies (force flag required)

### Quality Assurance (Run these before committing)
- `npm run typecheck` - TypeScript type checking (required)
- `npm run lint` - ESLint code linting (required)
- `npm test` - Run tests with Bun
- `npm run build` - Build production version

### Docker Deployment
- `npm run docker-build` - Build Docker image locally
- `docker compose up -d` - Run with docker-compose (recommended)
- Requires `AUTH_SECRET` environment variable: `openssl rand -base64 32`

## Architecture Overview

### State Management (Jotai)
- **Central atoms**: `habitsAtom`, `coinsAtom`, `wishlistAtom`, `usersAtom` in `lib/atoms.ts`
- **Derived atoms**: Computed values like `dailyHabitsAtom`, `coinsBalanceAtom`
- **Business logic hooks**: `useHabits`, `useCoins`, `useWishlist` in `/hooks`

### Data Models & Ownership
- **Individual ownership**: `CoinTransaction` has single `userId`
- **Shared ownership**: `Habit` and `WishlistItemType` have `userIds: string[]` array
- **Admin features**: Admin users can view/manage any user's data via dropdown selectors
- **Data persistence**: JSON files in `/data` directory with automatic `/backups`

### Key Components Structure
- **Feature components**: `HabitList`, `CoinsManager`, `WishlistManager` - main page components
- **Modal components**: `AddEditHabitModal`, `AddEditWishlistItemModal`, `UserSelectModal`
- **UI components**: `/components/ui` - shadcn/ui based components

### Authentication & Users
- NextAuth.js v5 with multi-user support
- User permissions: regular users vs admin users
- Admin dropdown patterns: Similar implementation across Habits/Wishlist pages (reference CoinsManager for pattern)

### Internationalization
- `next-intl` with messages in `/messages/*.json`
- Supported languages: English, Spanish, German, French, Russian, Chinese, Japanese

## Code Patterns

### Component Structure
```typescript
// Standard component pattern:
export default function ComponentName() {
  const [data, setData] = useAtom(dataAtom)
  const { businessLogicFunction } = useCustomHook()
  // Component logic
}
```

### Hook Patterns
- Custom hooks accept options: `useHabits({ selectedUser?: string })`
- Return destructured functions and computed values
- Handle both individual and shared ownership models

### Shared Ownership Pattern
```typescript
// Filtering for shared ownership:
const userItems = allItems.filter(item => 
  item.userIds && item.userIds.includes(targetUserId)
)
```

### Admin Dropdown Pattern
Reference `CoinsManager.tsx:107-119` for admin user selection implementation. Similar pattern should be applied to Habits and Wishlist pages.

## Data Safety
- Always backup `/data` before major changes
- Test with existing data files to prevent data loss
- Validate user permissions for all data operations
- Handle migration scripts carefully (see PLAN.md for shared ownership migration)

## Performance Considerations
- State updates use immutable patterns
- Large dataset filtering happens at hook level
- Derived atoms prevent unnecessary re-renders