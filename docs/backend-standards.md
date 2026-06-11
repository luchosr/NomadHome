---
description: Backend development standards, best practices, and conventions for the  Node.js/TypeScript/Express application including Domain-Driven Design, SOLID principles, architecture patterns, API design, and testing practices
globs:
  [
    'apps/api/src/**/*.ts',
    'packages/db/**/*.{prisma,ts}',
    'apps/api/tsconfig.json',
    'apps/api/package.json',
  ]
alwaysApply: true
---

# Backend Project Standards and Best Practices

## Table of Contents

- [Backend Project Standards and Best Practices](#backend-project-standards-and-best-practices)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Technology Stack](#technology-stack)
    - [Core Technologies](#core-technologies)
    - [Database \& ORM](#database--orm)
    - [Testing Framework](#testing-framework)
    - [Development Tools](#development-tools)
  - [Architecture Overview](#architecture-overview)
    - [Domain-Driven Design (DDD)](#domain-driven-design-ddd)
    - [Layered Architecture](#layered-architecture)
    - [Project Structure](#project-structure)
  - [Domain-Driven Design Principles](#domain-driven-design-principles)
    - [Entities](#entities)
    - [Value Objects](#value-objects)
    - [Aggregates](#aggregates)
    - [Repositories](#repositories)
    - [Domain Services](#domain-services)
    - [Additional Recommendations](#additional-recommendations)
  - [SOLID and DRY Principles](#solid-and-dry-principles)
    - [SOLID Principles](#solid-principles)
      - [Single Responsibility Principle (SRP)](#single-responsibility-principle-srp)
      - [Open/Closed Principle (OCP)](#openclosed-principle-ocp)
      - [Liskov Substitution Principle (LSP)](#liskov-substitution-principle-lsp)
      - [Interface Segregation Principle (ISP)](#interface-segregation-principle-isp)
      - [Dependency Inversion Principle (DIP)](#dependency-inversion-principle-dip)
    - [DRY (Don't Repeat Yourself)](#dry-dont-repeat-yourself)
  - [Coding Standards](#coding-standards)
    - [Naming Conventions](#naming-conventions)
    - [TypeScript Usage](#typescript-usage)
    - [Error Handling](#error-handling)
    - [Validation Patterns](#validation-patterns)
    - [Logging Standards](#logging-standards)
  - [API Design Standards](#api-design-standards)
    - [REST Endpoints](#rest-endpoints)
    - [Request/Response Patterns](#requestresponse-patterns)
    - [Error Response Format](#error-response-format)
    - [CORS Configuration](#cors-configuration)
  - [Database Patterns](#database-patterns)
    - [Prisma Schema](#prisma-schema)
    - [Migrations](#migrations)
    - [Repository Pattern](#repository-pattern)
  - [Testing Standards](#testing-standards)
    - [Test File Structure](#test-file-structure)
    - [Test Organization Pattern](#test-organization-pattern)
    - [Test Case Naming Convention](#test-case-naming-convention)
    - [Test Structure (AAA Pattern)](#test-structure-aaa-pattern)
    - [Mocking Standards](#mocking-standards)
    - [Test Coverage Requirements](#test-coverage-requirements)
    - [Error Testing](#error-testing)
    - [Controller Testing Specifics](#controller-testing-specifics)
    - [Service Testing Specifics](#service-testing-specifics)
    - [Database Testing](#database-testing)
    - [Async Testing](#async-testing)
    - [Test Data Management](#test-data-management)
    - [Integration Testing](#integration-testing)
    - [Code Quality Standards](#code-quality-standards)
      - [TypeScript Usage](#typescript-usage-1)
      - [Documentation](#documentation)
      - [Performance Considerations](#performance-considerations)
    - [Integration with Development Workflow](#integration-with-development-workflow)
    - [Common Anti-Patterns to Avoid](#common-anti-patterns-to-avoid)
    - [Example Test Structure](#example-test-structure)
  - [Performance Best Practices](#performance-best-practices)
    - [Database Query Optimization](#database-query-optimization)
    - [Async/Await Patterns](#asyncawait-patterns)
    - [Error Handling Performance](#error-handling-performance)
  - [Security Best Practices](#security-best-practices)
    - [Input Validation](#input-validation)
    - [Environment Variables](#environment-variables)
    - [Dependency Injection](#dependency-injection)
  - [Development Workflow](#development-workflow)
    - [Git Workflow](#git-workflow)
    - [Development Scripts](#development-scripts)
    - [Code Quality](#code-quality)
  - [Deployment](#deployment)

---

## Overview

This document outlines the best practices, conventions, and standards used in the backend application. The backend follows Domain-Driven Design (DDD) principles and implements a layered architecture to ensure code consistency, maintainability, and scalability.

## Technology Stack

### Core Technologies

- **Node.js**: Runtime environment
- **TypeScript**: Type-safe development with strict mode
- **Express.js**: Web application framework
- **Prisma**: Modern ORM for database access

### Database & ORM

- **PostgreSQL**: Relational database (Docker container)
- **Prisma Client**: Type-safe database client
- **Prisma Migrate**: Database migration tool

### Testing Framework

- **Vitest**: Testing framework with TypeScript support
- **Coverage Threshold**: 80% on changed lines (per [CLAUDE.md](../CLAUDE.md) §7); aim for 90% on critical domain code
- **Test Location**: `__tests__` directories and `.test.ts` files
- **Playwright**: End-to-end tests for critical flows (lives under `apps/web/e2e/` but exercises both `apps/web/` and `apps/api/`)

### Development Tools

- **ESLint**: Code linting (shared config in `packages/config/`)
- **Prettier**: Formatting (shared config in `packages/config/`)
- **TypeScript Compiler**: Type checking and compilation
- **pnpm + Turbo**: Monorepo task orchestration

## Architecture Overview

### Domain-Driven Design (DDD)

Domain-Driven Design is a methodology that focuses on modeling software according to business logic and domain knowledge. By centering development on a deep understanding of the domain, DDD facilitates the creation of complex systems.

**Benefits:**

- **Improved Communication**: Promotes a common language between developers and domain experts, improving communication and reducing interpretation errors.
- **Clear Domain Models**: Helps build models that accurately reflect business rules and processes.
- **High Maintainability**: By dividing the system into subdomains, it facilitates maintenance and software evolution.

### Layered Architecture

The backend follows a layered DDD architecture:

**Presentation Layer** (`src/presentation/`)

- Controllers handle HTTP requests/responses
- Routes define API endpoints
- Controllers use services from Application layer

**Application Layer** (`src/application/`)

- Services contain business logic and orchestration
- Validator handles input validation
- Services use repositories from Domain layer

**Domain Layer** (`src/domain/`)

- Models define core business entities (User, Listing, Booking, Review, Payout, etc. — see [docs/data-model.md](../docs/data-model.md))
- Repository interfaces define data access contracts
- Pure business logic without external dependencies

**Infrastructure Layer** (implicit)

- Prisma ORM handles database operations
- Repository implementations (via Prisma) satisfy domain interfaces

### Project Structure

```
apps/api/
├── src/
│   ├── domain/
│   │   ├── models/          # Domain entities (per capability)
│   │   └── repositories/    # Repository interfaces
│   ├── application/
│   │   ├── services/        # Business logic services
│   │   └── validator.ts     # Input validation (delegates to Zod schemas in packages/shared)
│   ├── presentation/
│   │   └── controllers/     # HTTP request handlers
│   ├── infrastructure/
│   │   ├── logger.ts        # Logging utilities (pino)
│   │   ├── email/           # Resend (or SendGrid) client wrapper
│   │   ├── payments/        # Stripe client wrapper
│   │   └── repositories/    # Prisma-backed repository implementations
│   ├── routes/              # Express route definitions
│   ├── middleware/          # Express middleware (requireAuth, requireRole, error handler)
│   └── index.ts             # Application entry point
├── test-utils/
│   ├── builders/            # Test data builders
│   └── mocks/               # Mock helpers
├── vitest.config.ts         # Vitest configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts

packages/db/
├── prisma/
│   ├── schema.prisma        # Single source of truth for DB structure
│   ├── migrations/          # Version-controlled migrations
│   └── seed.ts              # Seed script
└── package.json
```

## Domain-Driven Design Principles

### Entities

Entities are objects with a distinct identity that persists over time.

**Before:**

```typescript
// Anemic: data only, no behavior — every caller has to know the invariants.
const user = {
  id: 'usr_01H...',
  email: 'jane@example.com',
  passwordHash: '$2b$12$...',
  roles: ['guest'],
  emailVerifiedAt: null,
  disabledAt: null,
};
```

**After:**

```typescript
import { CreateUserInput } from '@nomadhome/shared/schemas/auth';

export class User {
  id: string;
  email: string;
  passwordHash: string;
  roles: string[];
  emailVerifiedAt: Date | null;
  disabledAt: Date | null;

  constructor(data: User) {
    this.id = data.id;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.roles = data.roles;
    this.emailVerifiedAt = data.emailVerifiedAt;
    this.disabledAt = data.disabledAt;
  }

  hasRole(role: 'guest' | 'host' | 'admin'): boolean {
    return this.roles.includes(role);
  }

  isActive(): boolean {
    return this.disabledAt === null && this.emailVerifiedAt !== null;
  }

  static create(input: CreateUserInput): User {
    return new User({
      id: crypto.randomUUID(),
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      roles: ['guest'],
      emailVerifiedAt: null,
      disabledAt: null,
    });
  }
}
```

**Explanation**: `User` is an entity because it has a stable identity (`id`) that distinguishes it from other users even when other attributes change. Behavior (`hasRole`, `isActive`, `create`) is owned by the entity rather than scattered across services.

**Best Practice**: Entities should encapsulate business logic related to their domain concept and maintain consistency of their internal state.

### Value Objects

Value Objects describe aspects of the domain without conceptual identity. They are defined by their attributes rather than an identifier and are immutable.

**Before:**

```typescript
// Money passed around as a primitive pair — easy to mix up cents and dollars,
// easy to add USD + EUR without noticing.
function computeTotal(rateCents: number, nights: number) {
  return rateCents * nights;
}
```

**After:**

```typescript
export class Money {
  readonly amountCents: number;
  readonly currency: string; // ISO 4217

  private constructor(amountCents: number, currency: string) {
    if (!Number.isInteger(amountCents)) {
      throw new Error('Money.amountCents must be an integer (cents)');
    }
    this.amountCents = amountCents;
    this.currency = currency;
  }

  static of(amountCents: number, currency: string): Money {
    return new Money(amountCents, currency);
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountCents + other.amountCents, this.currency);
  }

  minus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountCents - other.amountCents, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amountCents * factor), this.currency);
  }

  applyBps(bps: number): Money {
    return this.multiply(bps / 10_000);
  }

  equals(other: Money): boolean {
    return this.amountCents === other.amountCents && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
```

**Explanation**: `Money` is a Value Object because it has no identity — two `Money(1000, "USD")` instances are interchangeable. It is immutable (every operation returns a new instance), and it pushes invariants (integer cents, currency match) into the type itself rather than relying on caller discipline. This is exactly the shape we need for booking pricing where amounts and fees flow across services.

**Recommendation**: Prefer Value Objects whenever a concept has no lifecycle of its own. Other NomadHome examples that fit: `DateRange` (check-in/check-out), `Email`, `BasisPoints`.

### Aggregates

Aggregates are clusters of objects that must be treated as a unit. They have a root entity that enforces invariants and consistency boundaries.

**Before:**

```typescript
// Listing, photos, and amenities mutated independently from controllers —
// nothing prevents publishing a listing with zero photos.
const listing = { id: 'lst_1', status: 'PUBLISHED', nightlyRateCents: 0 };
const photos = []; // empty
await db.listing.update({ where: { id: 'lst_1' }, data: { status: 'PUBLISHED' } });
```

**After:**

```typescript
export class Listing {
  id: string;
  hostId: string;
  title: string;
  type: 'PROPERTY' | 'WORKSPACE';
  nightlyRate: Money;
  capacity: number;
  status: 'DRAFT' | 'PUBLISHED' | 'DISABLED';
  photos: ListingPhoto[];
  amenityCodes: string[];

  constructor(data: Omit<Listing, 'publish' | 'unpublish' | 'addPhoto'>) {
    Object.assign(this, data);
  }

  publish(): void {
    if (this.status === 'DISABLED') {
      throw new Error('Cannot publish a disabled listing');
    }
    if (this.photos.length < 1) {
      throw new Error('Listing requires at least one photo before publishing');
    }
    if (this.amenityCodes.length < 1) {
      throw new Error('Listing requires at least one amenity before publishing');
    }
    if (this.nightlyRate.amountCents <= 0) {
      throw new Error('Listing nightly rate must be greater than zero');
    }
    this.status = 'PUBLISHED';
  }

  unpublish(): void {
    if (this.status === 'PUBLISHED') {
      this.status = 'DRAFT';
    }
  }

  addPhoto(photo: ListingPhoto): void {
    const exists = this.photos.some((p) => p.position === photo.position);
    if (exists) {
      throw new Error(`Photo position ${photo.position} already taken`);
    }
    this.photos.push(photo);
  }
}
```

**Explanation**: `Listing` is the aggregate root that contains `ListingPhoto[]` and amenity references. All mutations (publish, add a photo) go through the root, which enforces invariants in one place. The `publish()` method codifies the rules from [docs/data-model.md](../docs/data-model.md) §3.6 so they cannot be bypassed.

**Recommendation**: Operations that affect aggregate members (`ListingPhoto`, the amenity join) are handled through the root. Repositories load and save the root as a unit; never let callers `INSERT` into `ListingPhoto` directly.

### Repositories

Repositories provide interfaces for accessing aggregates and entities, encapsulating data access logic. The interface lives in the **domain** layer; the Prisma-backed implementation lives in the **infrastructure** layer.

**Before:**

```typescript
// Direct Prisma access from controllers — couples HTTP to ORM,
// makes testing slow, and leaks "ORM shape" into the rest of the code.
function getListingById(id: string) {
  return prisma.listing.findUnique({ where: { id } });
}
```

**After:**

```typescript
// apps/api/src/domain/repositories/IListingRepository.ts
export interface IListingRepository {
  findById(id: string): Promise<Listing | null>;
  findPublishedByCity(query: SearchQuery): Promise<Paginated<Listing>>;
  save(listing: Listing): Promise<Listing>;
  delete(id: string): Promise<void>;
}

// apps/api/src/infrastructure/repositories/ListingRepository.ts
export class ListingRepository implements IListingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Listing | null> {
    const data = await this.prisma.listing.findUnique({
      where: { id },
      include: { photos: true, amenities: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async save(listing: Listing): Promise<Listing> {
    // Upsert root + nested photos/amenities in one transaction so the
    // aggregate is persisted as a unit.
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.listing.upsert({
        where: { id: listing.id },
        create: this.toPersistence(listing),
        update: this.toPersistence(listing),
      });
      await this.syncPhotos(tx, listing);
      await this.syncAmenities(tx, listing);
      return this.toDomain(saved);
    });
  }

  private toDomain(row: PrismaListing & { photos: PrismaListingPhoto[]; amenities: { amenityCode: string }[] }): Listing {
    return new Listing({
      id: row.id,
      hostId: row.hostId,
      title: row.title,
      type: row.type,
      nightlyRate: Money.of(row.nightlyRateCents, row.currency),
      capacity: row.capacity,
      status: row.status,
      photos: row.photos.map((p) => new ListingPhoto(p)),
      amenityCodes: row.amenities.map((a) => a.amenityCode),
    });
  }

  private toPersistence(listing: Listing) {
    return {
      id: listing.id,
      hostId: listing.hostId,
      title: listing.title,
      type: listing.type,
      nightlyRateCents: listing.nightlyRate.amountCents,
      currency: listing.nightlyRate.currency,
      capacity: listing.capacity,
      status: listing.status,
    };
  }

  // syncPhotos, syncAmenities, findPublishedByCity, delete elided for brevity
}
```

**Explanation**: `ListingRepository` provides a clear interface for accessing the `Listing` aggregate, encapsulating Prisma usage. Domain code depends on `IListingRepository`; only the infrastructure layer depends on Prisma. This is what makes service tests fast (mock the interface) and integration tests focused (test the implementation against a real database).

**Recommendation**:

- Develop complete repository interfaces for each aggregate, ensuring all database interactions pass through the repository.
- Implement repository methods that handle collections (e.g., `findPublishedByCity`), filtered or modified in bulk.
- Use dependency injection to inject `PrismaClient` into repositories — never reach for a singleton.

### Domain Services

Domain Services contain business logic that doesn't naturally belong to an entity or value object — typically logic that spans multiple aggregates or depends on configuration external to any single entity.

**Before:**

```typescript
// Pricing math scattered across booking controller, email template,
// and admin payout report — every implementation drifts subtly.
function priceBreakdown(listing: any, nights: number, feeConfig: any) {
  const subtotal = listing.nightlyRateCents * nights;
  const guestFee = Math.round(subtotal * (feeConfig.guestServiceFeeBps / 10000));
  const hostCommission = Math.round(subtotal * (feeConfig.hostCommissionBps / 10000));
  return { subtotal, guestFee, hostCommission, total: subtotal + guestFee };
}
```

**After:**

```typescript
export interface PriceBreakdown {
  nights: number;
  nightlyRate: Money;
  subtotal: Money;
  guestServiceFee: Money;
  hostCommission: Money;
  total: Money; // what the guest is charged
  payout: Money; // what the host receives
}

export class PricingService {
  computeBreakdown(
    listing: Listing,
    dateRange: DateRange,
    feeConfig: PlatformFeeConfig,
  ): PriceBreakdown {
    const nights = dateRange.nights();
    const subtotal = listing.nightlyRate.multiply(nights);
    const guestServiceFee = subtotal.applyBps(feeConfig.guestServiceFeeBps);
    const hostCommission = subtotal.applyBps(feeConfig.hostCommissionBps);

    return {
      nights,
      nightlyRate: listing.nightlyRate,
      subtotal,
      guestServiceFee,
      hostCommission,
      total: subtotal.plus(guestServiceFee),
      payout: subtotal.minus(hostCommission),
    };
  }
}
```

**Explanation**: `PricingService` encapsulates a calculation that depends on three inputs (a `Listing` aggregate, a `DateRange` value object, and a `PlatformFeeConfig` row). It does not belong on `Listing` because the fee config is external, and it does not belong on `Booking` because we need to quote a price *before* a booking exists. A domain service is the right home. The result uses `Money` end-to-end, so currency-mismatch bugs cannot reach a Stripe Checkout session.

### Additional Recommendations

**Use of Factories**

Factories are useful in DDD to encapsulate the logic of creating complex objects, ensuring that all created objects comply with domain rules from the moment of creation.

**Recommendation**: Implement factories for the creation of entities and aggregates, especially those that are complex and require specific initial configuration that complies with business rules.

**Improvement in Relationship Modeling**

Relationships between entities and aggregates must be clear and consistent with business rules.

**Recommendation**: Review and possibly redesign relationships between entities to ensure they accurately reflect domain needs and rules. This may include removing unnecessary relationships or adding new relationships that facilitate business operations.

**Domain Events Integration**

Domain events are an important part of DDD and can be used to handle side effects of domain operations in a decoupled manner.

**Recommendation**: Implement a domain event system that allows entities and aggregates to publish events that other system components can handle without being tightly coupled to the entities that generate them.

## SOLID and DRY Principles

### SOLID Principles

SOLID principles are five object-oriented design principles that help create more understandable, flexible, and maintainable systems.

#### Single Responsibility Principle (SRP)

Each class should have a single responsibility or reason to change.

**Before:**

```typescript
// One function that validates, hashes, persists, audits, and emails — five reasons to change.
async function registerUser(input: { email: string; password: string }) {
  if (!input.email.includes('@')) {
    console.error('Invalid email');
    return;
  }
  const hash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { email: input.email, passwordHash: hash } });
  await prisma.authAuditEvent.create({ data: { userId: user.id, event: 'registered' } });
  await resend.emails.send({ to: input.email, subject: 'Verify your email', html: '...' });
  console.log('User registered');
  return user;
}
```

**After:**

```typescript
// Domain entity — owns invariants only.
export class User {
  validateEmail(): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      throw new ValidationError('Invalid email');
    }
  }
}

// Application service — orchestrates the workflow.
export class IdentityService {
  constructor(
    private readonly users: IUserRepository,
    private readonly audit: AuthAuditService,
    private readonly email: EmailService,
    private readonly hasher: PasswordHasher,
  ) {}

  async register(input: RegisterUserInput): Promise<User> {
    const user = User.create({ email: input.email, passwordHash: await this.hasher.hash(input.password) });
    user.validateEmail();
    await this.users.save(user);
    await this.audit.record('registered', { userId: user.id, ipAddress: input.ipAddress });
    await this.email.sendVerification(user);
    return user;
  }
}
```

**Explanation**: Each class now has a single reason to change — `User` for invariants, `IUserRepository` for persistence, `AuthAuditService` for audit, `EmailService` for delivery, `IdentityService` for orchestration. New rules around email format never force a change in the persistence layer, and vice versa.

**Recommendation**: When you find yourself writing "and" in the description of a function ("validates and saves and emails"), split it.

#### Open/Closed Principle (OCP)

Software entities should be open for extension but closed for modification.

**Before:**

```typescript
// Adding a new cancellation tier requires editing the if/else block every time.
function refundAmountCents(booking: Booking, today: Date): number {
  const daysUntilCheckIn = Math.floor((booking.checkIn.getTime() - today.getTime()) / 86_400_000);
  if (daysUntilCheckIn >= 7) return booking.totalChargedCents;
  if (daysUntilCheckIn >= 1) return Math.floor(booking.totalChargedCents * 0.5);
  return 0;
}
```

**After:**

```typescript
export interface CancellationPolicy {
  refund(booking: Booking, today: Date): Money;
}

export class TieredCancellationPolicy implements CancellationPolicy {
  constructor(private readonly tiers: { minDaysBefore: number; refundFraction: number }[]) {}

  refund(booking: Booking, today: Date): Money {
    const daysUntilCheckIn = Math.floor((booking.checkIn.getTime() - today.getTime()) / 86_400_000);
    const tier = this.tiers.find((t) => daysUntilCheckIn >= t.minDaysBefore);
    const fraction = tier?.refundFraction ?? 0;
    return booking.totalCharged.multiply(fraction);
  }
}

// Adding a new policy (e.g., NonRefundablePolicy, GraceWindowPolicy) requires no edit to
// existing code or callers — just implement the interface and inject it.
```

**Explanation**: The refund logic is now closed for modification (`TieredCancellationPolicy` does not change when product wants a new tier scheme) but open for extension (a new `CancellationPolicy` implementation replaces it via DI). This matters for NomadHome because cancellation tiers are listed as an open question (XC-7.2 in [docs/tasks.md](tasks.md)) and will likely change post-MVP.

**Recommendation**: When a function grows a chain of `if` branches keyed off a configurable concept, that concept wants to become an interface.

#### Liskov Substitution Principle (LSP)

Objects of a derived class should be replaceable with objects of the base class without altering the program's functionality.

**Before:**

```typescript
// In-memory test double that violates the contract — production code
// expects a returned User, this throws instead.
class InMemoryUserRepository implements IUserRepository {
  async save(user: User): Promise<User> {
    throw new Error('save is not supported in tests');
  }
  // ...
}
```

**After:**

```typescript
class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>();

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user; // honors the contract: returns the persisted user
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.store.values()].find((u) => u.email === email) ?? null;
  }
}
```

**Explanation**: `InMemoryUserRepository` is a fully substitutable implementation of `IUserRepository`. Tests using it behave the same way production code does — no surprise exceptions, no special-cased behavior. This matters because the same `IdentityService.register` should pass tests that swap the Prisma-backed repository for the in-memory one.

**Recommendation**: Prefer composition over inheritance. When you do extend, treat the parent's contract as a hard constraint: derived classes accept the same inputs and return the same kinds of outputs.

#### Interface Segregation Principle (ISP)

Many specific interfaces are better than a single general interface.

**Before:**

```typescript
// A god repository that every consumer depends on, even those that only read.
interface IListingRepository {
  findById(id: string): Promise<Listing | null>;
  findPublishedByCity(query: SearchQuery): Promise<Paginated<Listing>>;
  save(listing: Listing): Promise<Listing>;
  delete(id: string): Promise<void>;
  recomputeAverageRating(listingId: string): Promise<void>;
  syncPhotos(listingId: string, photos: ListingPhoto[]): Promise<void>;
  syncAmenities(listingId: string, amenityCodes: string[]): Promise<void>;
}
```

**After:**

```typescript
// Read-side: used by Search, listing detail page, host dashboard.
export interface IListingReader {
  findById(id: string): Promise<Listing | null>;
  findPublishedByCity(query: SearchQuery): Promise<Paginated<Listing>>;
}

// Write-side: used by host listing create/edit flows.
export interface IListingWriter {
  save(listing: Listing): Promise<Listing>;
  delete(id: string): Promise<void>;
}

// Specialized: used by ReviewService after each review insert.
export interface IListingRatingUpdater {
  recomputeAverageRating(listingId: string): Promise<void>;
}

// The Prisma-backed class can implement all three; consumers only depend on
// the slice they need, which keeps tests focused and reduces accidental coupling.
export class ListingRepository implements IListingReader, IListingWriter, IListingRatingUpdater {
  // ...
}
```

**Explanation**: A controller that only renders the public listing page depends on `IListingReader`. It doesn't see `save()`, so it cannot accidentally write. Tests for that controller mock only two methods instead of seven.

**Recommendation**: When more than half of an interface's methods are unused by a given consumer, the interface is too wide. Split it along usage boundaries.

#### Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules; both should depend on abstractions.

**Before:**

```typescript
// IdentityService depends directly on Prisma, Resend, and Stripe SDKs.
// Unit tests need real connections; swapping providers means rewriting the service.
class IdentityService {
  private readonly prisma = new PrismaClient();
  private readonly resend = new Resend(process.env.RESEND_API_KEY!);

  async register(email: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({ data: { email, passwordHash: hash } });
    await this.resend.emails.send({ to: email, subject: '...', html: '...' });
    return user;
  }
}
```

**After:**

```typescript
// Domain-layer abstractions
export interface IUserRepository { save(user: User): Promise<User>; /* ... */ }
export interface EmailService { sendVerification(user: User): Promise<void>; }
export interface PasswordHasher { hash(plain: string): Promise<string>; verify(plain: string, hash: string): Promise<boolean>; }

// Application service depends only on abstractions.
export class IdentityService {
  constructor(
    private readonly users: IUserRepository,
    private readonly email: EmailService,
    private readonly hasher: PasswordHasher,
  ) {}

  async register(input: RegisterUserInput): Promise<User> {
    const user = User.create({
      email: input.email,
      passwordHash: await this.hasher.hash(input.password),
    });
    await this.users.save(user);
    await this.email.sendVerification(user);
    return user;
  }
}

// Composition root (apps/api/src/index.ts) wires the concrete implementations.
const identityService = new IdentityService(
  new ListingRepository(prisma),
  new ResendEmailService(resendClient),
  new BcryptPasswordHasher({ cost: 12 }),
);
```

**Explanation**: `IdentityService` no longer knows about Prisma, Resend, or bcrypt. Unit tests inject in-memory fakes; swapping Resend for SendGrid is a one-line change in the composition root. The high-level orchestration logic and the low-level infrastructure both depend on the abstractions in between.

**Recommendation**: Inject dependencies through the constructor. Reserve `new SomeSDK()` for the composition root (`apps/api/src/index.ts`) and for tests.

### DRY (Don't Repeat Yourself)

The DRY principle focuses on reducing duplication in code. Each piece of knowledge should have a single, unambiguous, and authoritative representation within a system.

**Before:**

```typescript
// Same overlap check duplicated in two services — one will drift.
class BookingService {
  async startCheckout(input: CreateBookingInput) {
    const overlaps = await prisma.availabilityBlock.findMany({
      where: { listingId: input.listingId, startDate: { lt: input.checkOut }, endDate: { gt: input.checkIn } },
    });
    if (overlaps.length > 0) throw new ConflictError('Dates not available');
    // ...
  }
}

class AvailabilityService {
  async block(input: BlockInput) {
    const overlaps = await prisma.availabilityBlock.findMany({
      where: { listingId: input.listingId, startDate: { lt: input.endDate }, endDate: { gt: input.startDate } },
    });
    if (overlaps.length > 0) throw new ConflictError('Range overlaps existing block');
    // ...
  }
}
```

**After:**

```typescript
export class AvailabilityService {
  constructor(private readonly blocks: IAvailabilityBlockRepository) {}

  async isAvailable(listingId: string, range: DateRange): Promise<boolean> {
    const overlaps = await this.blocks.findOverlapping(listingId, range);
    return overlaps.length === 0;
  }
}

// Booking and host-block flows both delegate to the single source of truth.
await this.availability.isAvailable(input.listingId, range); // BookingService
await this.availability.isAvailable(input.listingId, range); // host block flow
```

**Explanation**: The overlap rule lives in exactly one place. When we add the Postgres EXCLUDE constraint at the DB level (see [docs/data-model.md](data-model.md) §3.10), we only need to update one method to surface the resulting error as `409 OVERLAP_CONFLICT`.

**Recommendation**: When two services compute the same domain fact (availability, pricing, refund amount), extract it into a single service the others depend on.

## Coding Standards

### Naming Conventions

- **Variable Naming**: Use camelCase for variables and functions (e.g., `listingId`, `findUserById`)
- **Class Naming**: Use PascalCase for classes and interfaces (e.g., `Listing`, `ListingRepository`)
- **Constants Naming**: Use UPPER_SNAKE_CASE for constants (e.g., `MAX_SEARCH_RESULTS_PER_PAGE`)
- **Type Naming**: Use PascalCase for types and interfaces (e.g., `BookingDTO`, `IListingRepository`)
- **File Naming**: Use camelCase for file names (e.g., `listingService.ts`, `bookingController.ts`)

**Examples:**

```typescript
// Good: All in English
export class ListingRepository {
  async findById(listingId: string): Promise<Listing | null> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { photos: true, amenities: true },
    });
    return listing ? this.toDomain(listing) : null;
  }
}

// Avoid: Non-English comments or names
export class RepositorioAlojamiento {
  async buscarPorId(idAlojamiento: string): Promise<Alojamiento | null> {
    const alojamiento = await this.prisma.listing.findUnique({
      where: { id: idAlojamiento },
    });
    return alojamiento ? new Alojamiento(alojamiento) : null;
  }
}
```

**Error Messages and Logs:**

```typescript
// Good: English error messages
throw new NotFoundError('Listing not found with the provided ID');
logger.error('Failed to create listing', { error: error.message });

// Avoid: Non-English messages
throw new NotFoundError('Alojamiento no encontrado con el ID proporcionado');
logger.error('Error al crear alojamiento', { error: error.message });
```

### TypeScript Usage

- **Strict Mode**: Always enable strict mode in `tsconfig.json`
- **Type Definitions**: Use explicit types for function parameters and return values
- **Interfaces**: Define interfaces for complex data structures
- **Avoid `any`**: Use `unknown` or specific types instead of `any` when possible

```typescript
// Good: Explicit types
async function findListingById(id: string): Promise<Listing | null> {
  // implementation
}

// Avoid: Using any
function processData(data: any): any {
  // implementation
}
```

### Error Handling

- **Custom Error Classes**: Create domain-specific error classes
- **Error Middleware**: Use global error middleware for consistent error responses
- **Error Messages**: Provide descriptive error messages for debugging

```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// In controller
try {
  const listing = await listingService.findById(id);
  if (!listing) {
    throw new NotFoundError('Listing not found');
  }
  res.json({ success: true, data: listing });
} catch (error) {
  next(error);
}
```

### Validation Patterns

- **Input Validation**: Validate all inputs at the application layer
- **Use Validator Module**: Centralize validation logic in `src/application/validator.ts`
- **Validate Before Processing**: Always validate before executing business logic

```typescript
import { CreateListingSchema } from '@nomadhome/shared/schemas/listings';

export async function createListing(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validated = CreateListingSchema.parse(req.body);
    const listing = await listingService.create({ hostId: req.user.id, payload: validated });
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
}
```

### Logging Standards

- **Use Logger Class**: Use the centralized logger from `src/infrastructure/logger.ts`
- **Log Levels**: Use appropriate log levels (info, error, warn, debug)
- **Structured Logging**: Include relevant context in log messages

```typescript
import { logger } from '../infrastructure/logger';

logger.info('Listing published', { listingId: listing.id, hostId: listing.hostId });
logger.error('Failed to create booking', { error: error.message, listingId, guestId });
```

## API Design Standards

### REST Endpoints

- **RESTful Naming**: Use RESTful conventions for endpoint naming
- **HTTP Methods**: Use appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Resource-Based URLs**: URLs should represent resources, not actions

```typescript
GET    /api/v1/listings/search   // Search listings (public)
GET    /api/v1/listings/:id      // Get listing by ID
POST   /api/v1/listings          // Create new listing (host)
PUT    /api/v1/listings/:id      // Update listing (host owner)
POST   /api/v1/listings/:id/publish    // Publish listing (host owner)
POST   /api/v1/listings/:id/unpublish  // Revert to draft (host owner)
```

### Request/Response Patterns

- **JSON Format**: Use JSON for request and response bodies
- **Consistent Structure**: Maintain consistent response structure across all endpoints
- **Status Codes**: Use appropriate HTTP status codes

```typescript
// Success response
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}

// Error response
{
    "success": false,
    "error": {
        "message": "Error description",
        "code": "ERROR_CODE"
    }
}
```

### Error Response Format

- **Consistent Format**: All errors should follow the same response structure
- **Error Codes**: Use meaningful error codes for different error types
- **HTTP Status Codes**: Map errors to appropriate HTTP status codes

```typescript
// 400 Bad Request
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "code": "VALIDATION_ERROR",
        "details": [ ... ]
    }
}

// 404 Not Found
{
    "success": false,
    "error": {
        "message": "Resource not found",
        "code": "NOT_FOUND"
    }
}
```

### CORS Configuration

- **Enable CORS**: Configure CORS to allow frontend origin
- **Secure Configuration**: Only allow specific origins in production
- **Credentials**: Configure credentials handling appropriately

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
```

## Database Patterns

### Prisma Schema

- **Single Source of Truth**: `prisma/schema.prisma` is the single source of truth for database structure
- **Relationships**: Define relationships using Prisma relations
- **Naming Conventions**: Use consistent naming conventions (camelCase for fields, PascalCase for models)

### Migrations

- **Version Control**: All database changes must be version-controlled through migrations
- **Migration Naming**: Use descriptive names for migrations
- **Review Migrations**: Review migration files before applying

```bash
# Create migration
npx prisma migrate dev --name descriptive_migration_name

# Apply migrations in production
npx prisma migrate deploy
```

### Repository Pattern

- **Repository Interfaces**: Define repository interfaces in the domain layer
- **Prisma Implementation**: Implement repositories using Prisma in the infrastructure layer
- **Dependency Injection**: Inject Prisma client into repositories

```typescript
// Domain layer interface
export interface IBookingRepository {
  findById(id: string): Promise<Booking | null>;
  save(booking: Booking): Promise<Booking>;
  findUpcomingForHost(hostId: string): Promise<Booking[]>;
}

// Infrastructure layer implementation
export class BookingRepository implements IBookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Booking | null> {
    const data = await this.prisma.booking.findUnique({ where: { id } });
    return data ? new Booking(data) : null;
  }

  // save, findUpcomingForHost elided
}
```

## Testing Standards

The project has strict requirements for code quality and maintainability. These are the unit testing standards and best practices that must be applied.

### Test File Structure

- Use descriptive test file names: `[componentName].test.ts`
- Place test files alongside the source code they test
- Use Vitest as the testing framework with TypeScript support (per [CLAUDE.md](../CLAUDE.md) §3)
- Coverage floor: ≥80% on changed lines (per [CLAUDE.md](../CLAUDE.md) §7); target 90% on critical domain code

### Test Organization Pattern

Template:

```typescript
import { describe, it, beforeEach, expect, vi } from 'vitest';

describe('[ComponentName] - [methodName]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('should_[expected_behavior]_when_[condition]', () => {
    it('should [specific test case]', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

Real example:

```typescript
import { describe, it, beforeEach, expect, vi, type Mock } from 'vitest';

describe('ListingService - findById', () => {
  let repo: { findById: Mock };
  let service: ListingService;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = { findById: vi.fn() };
    service = new ListingService(repo as unknown as IListingRepository);
  });

  it('should return listing when found', async () => {
    // Arrange
    const listingId = 'lst_01H...';
    const mockListing = aListing({ id: listingId, status: 'PUBLISHED' });
    repo.findById.mockResolvedValue(mockListing);

    // Act
    const result = await service.findById(listingId);

    // Assert
    expect(result).toEqual(mockListing);
    expect(repo.findById).toHaveBeenCalledWith(listingId);
  });
});
```

### Test Case Naming Convention

- Use descriptive, behavior-driven naming: `should_[expected_behavior]_when_[condition]`
- Group related test cases under descriptive `describe` blocks
- Use snake_case for describe blocks and camelCase for individual tests

### Test Structure (AAA Pattern)

Always follow the Arrange-Act-Assert pattern:

```typescript
it('should confirm booking and snapshot fees when checkout completes', async () => {
  // Arrange — Set up test data and mocks
  const booking = aBooking({ status: 'PENDING_PAYMENT' });
  const stripeEvent = aCheckoutCompletedEvent({ bookingId: booking.id });
  bookingRepo.findById.mockResolvedValue(booking);

  // Act — Execute the function under test
  const result = await bookingService.handleStripeWebhook(stripeEvent);

  // Assert — Verify the expected behavior
  expect(result.status).toBe('CONFIRMED');
  expect(result.confirmedAt).toBeInstanceOf(Date);
  expect(emailService.sendBookingConfirmation).toHaveBeenCalledTimes(2); // guest + host
});
```

Assertion pattern:

- Use specific matchers: `toHaveBeenCalledWith()`, `toHaveBeenCalledTimes()`
- Verify both successful operations and error conditions
- Check that mocks were called with correct parameters
- Assert on return values and side effects

### Mocking Standards

- Mock all external dependencies (models, services, database clients)
- Mock repository layers in service tests
- Mock service layers in controller tests
- Use `vi.mock()` at the top of test files for module-level mocking
- Create mock instances with realistic data structures
- Clear all mocks in `beforeEach()` to ensure test isolation

### Test Coverage Requirements

- **Comprehensive test coverage**: Include these test categories for each function:

1. **Happy Path Tests**: Valid inputs producing expected outputs
2. **Error Handling Tests**: Invalid inputs, missing data, database errors
3. **Edge Cases**: Boundary values, null/undefined inputs, empty data
4. **Validation Tests**: Input validation, business rule enforcement
5. **Integration Points**: External service calls, database operations

- **Threshold**: ≥80% on changed lines (CI gate per [CLAUDE.md](../CLAUDE.md) §7); target 90% on critical domain code
- **Coverage Reports**: Generate coverage reports with `pnpm test --coverage`
- **Coverage Files**: Coverage reports in `coverage/` directory adding the date, like YYYYMMDD-api-coverage.md

### Error Testing

- Test both expected errors and unexpected errors
- Verify error messages are descriptive and helpful
- Test error propagation through service layers
- Ensure proper HTTP status codes in controller tests

### Controller Testing Specifics

- Mock the service layer completely
- Test HTTP request/response handling
- Verify parameter parsing and validation
- Test error response formatting
- Use realistic Express Request/Response mocks

### Service Testing Specifics

- Mock domain models and repositories
- Test business logic in isolation
- Verify data transformation and validation
- Test error handling and edge cases
- Mock external dependencies (Prisma, validators)

### Database Testing

- Mock Prisma client and all database operations
- Test both successful and failed database operations
- Verify correct database queries and parameters
- Test transaction handling and rollback scenarios

### Async Testing

- Always use `async/await` for asynchronous operations
- Use `Promise.allSettled()` for testing concurrent operations
- Properly handle promise rejections in tests
- Test timeout scenarios where applicable

### Test Data Management

- Use factory functions for creating test data
- Keep test data consistent and realistic
- Avoid hardcoded values in multiple places
- Use meaningful test data that reflects real-world scenarios

### Integration Testing

- **Controller Testing**: Test HTTP request/response handling
- **Database Testing**: Test repository implementations with database
- **End-to-End Flow**: Test complete request flows

### Code Quality Standards

#### TypeScript Usage

- Use strict typing for all test parameters and return values
- Define proper interfaces for mock data
- Use type assertions sparingly and with proper justification
- Leverage TypeScript's type system for better test reliability

#### Documentation

- Write clear, descriptive test names that explain the scenario
- Add comments for complex test setups
- Document any special test conditions or edge cases
- Keep test code as readable as production code

#### Performance Considerations

- Keep tests fast and focused
- Avoid unnecessary async operations in tests
- Use appropriate mock strategies to avoid real I/O
- Group related tests to minimize setup/teardown overhead

### Integration with Development Workflow

- Run tests before every commit
- Ensure all tests pass before merging
- Use test-driven development when appropriate
- Update tests when modifying existing functionality

### Common Anti-Patterns to Avoid

- Don't test implementation details, test behavior
- Don't create overly complex test setups
- Don't ignore failing tests or skip error scenarios
- Don't use real database connections in unit tests
- Don't create tests that depend on external services
- Don't write tests that are too tightly coupled to implementation

### Example Test Structure

## Performance Best Practices

### Database Query Optimization

- **Select Specific Fields**: Only select fields that are needed
- **Use Indexes**: Ensure proper database indexes for frequently queried fields
- **Avoid N+1 Queries**: Use Prisma's `include` to fetch related data efficiently

```typescript
// Good: Fetch related data efficiently
const listing = await prisma.listing.findUnique({
  where: { id },
  include: {
    photos: { orderBy: { position: 'asc' } },
    amenities: { include: { amenity: true } },
    reviews: { take: 10, orderBy: { createdAt: 'desc' } },
  },
});

// Avoid: N+1 queries
const listing = await prisma.listing.findUnique({ where: { id } });
const photos = await prisma.listingPhoto.findMany({ where: { listingId: id } });
const amenities = await prisma.listingAmenity.findMany({ where: { listingId: id } });
```

### Async/Await Patterns

- **Always Use Async/Await**: Use async/await instead of promises chains
- **Error Handling**: Properly handle errors in async operations
- **Parallel Operations**: Use `Promise.all()` for parallel operations when appropriate

```typescript
// Good: Parallel operations
const [listing, recentReviews, upcomingBookings] = await Promise.all([
  listingService.findById(listingId),
  reviewService.findRecentForListing(listingId, { limit: 10 }),
  bookingService.findUpcomingForListing(listingId),
]);
```

### Error Handling Performance

- **Early Returns**: Return early to avoid unnecessary processing
- **Error Propagation**: Let errors propagate naturally through the call stack
- **Avoid Over-Wrapping**: Don't wrap errors unnecessarily

## Security Best Practices

### Input Validation

- **Validate All Inputs**: Validate all user inputs before processing
- **Sanitize Data**: Sanitize data to prevent injection attacks
- **Type Checking**: Use TypeScript and validation to ensure type safety

### Environment Variables

- **Never Commit Secrets**: Never commit `.env` files or secrets to version control
- **Use Environment Variables**: Use environment variables for configuration
- **Validate Environment**: Validate required environment variables at startup

```typescript
// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'PORT'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### Dependency Injection

- **Inject Prisma Client**: Inject Prisma client via Express middleware
- **Avoid Global State**: Avoid global state for database connections
- **Testability**: Use dependency injection to improve testability

```typescript
// Composition root (apps/api/src/index.ts) wires concrete services once.
const prisma = new PrismaClient();
const listingRepository = new ListingRepository(prisma);
const listingService = new ListingService(listingRepository);

// Middleware exposes services on the request (or use a DI container if the graph grows).
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.services = { listingService /* ... */ };
  next();
});

// Use in controllers — controllers depend on services, not on Prisma.
export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await req.services.listingService.findById(req.params.id);
    if (!listing) throw new NotFoundError('Listing not found');
    res.json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
}
```

## Development Workflow

### Git Workflow

- **Feature Branches**: Develop features in separate branches using clear descriptive names to allow working in parallel and avoid conflicts or collisions
- **Descriptive Commits**: Write descriptive commit messages in English
- **Code Review**: Code review before merging
- **Small Branches**: Keep branches small and focused

### Development Scripts

```bash
pnpm dev             # Development server with hot reload
pnpm build           # Build for production
pnpm test            # Run tests
pnpm test --coverage # Run tests with coverage
pnpm db:generate     # Generate Prisma client
pnpm db:migrate:dev  # Create and apply migration
pnpm db:seed         # Seed database
```

### Code Quality

- **ESLint Validation**: Run ESLint before commits
- **TypeScript Compilation**: Ensure TypeScript compiles without errors
- **All Tests Passing**: Ensure all tests pass before deployment
- **Code Review**: Review code for adherence to standards

## Deployment

The deployment target is not locked at the MVP stage. The locked stack ([CLAUDE.md](../CLAUDE.md) §3) is Node.js + Express running as a long-lived process; the API entry point is `apps/api/src/index.ts`. Any change to deployment topology (containers, Lambda, edge runtime) requires an ADR via the OpenSpec workflow and is out of scope for this standards document.

---

This document serves as the foundation for maintaining code quality and consistency across the backend application. All team members should follow these practices to ensure a maintainable, scalable, and testable codebase.
