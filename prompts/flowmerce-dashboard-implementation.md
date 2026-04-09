# Flowmerce Dashboard Implementation Prompt

Build the real Flowmerce admin dashboard by turning the existing MVP frontend into a data-driven product and by adding a dedicated dashboard module to the NestJS backend that supplies dashboard-oriented read models and operational summaries.

This is an implementation prompt, not only a UI prompt. The work must produce a practical foundation for a production-style admin dashboard for a distributed order platform.

## Project Context

There are two related codebases in the workspace:

- `Flowmerce/` - NestJS backend for the distributed order and fulfillment platform
- `flowmerce-dashboard-mvp/` - React + Vite MVP dashboard frontend currently powered by mock data

The backend already contains bounded contexts for:

- Orders
- Inventory
- Payments
- Shipping
- Notifications
- Health monitoring
- Authentication / roles

The frontend MVP already contains pages for:

- Overview
- Users
- Orders
- Inventory
- Payments
- Shipments
- Notifications
- Infrastructure health

The frontend currently uses local mock data and presents a strong visual direction, but it is not yet connected to real backend data and the backend does not yet expose a dashboard-focused aggregation layer.

## Core Objective

Implement a real admin dashboard system with these two coordinated deliverables:

1. A new backend `dashboard` module in Flowmerce that exposes read-optimized endpoints for the admin dashboard
2. A refactor of the MVP frontend so it consumes those endpoints instead of hardcoded mock data

The dashboard should feel like an operations control center for Flowmerce, not a simple CRUD admin panel.

## Important Reality About The Current Backend

The current backend is strong on domain actions and per-entity operations, but weak on dashboard reads.

Examples of current behavior:

- Orders support create, get by id, confirm, cancel
- Inventory supports get by sku/id, reserve, release
- Payments support process, get, refund
- Shipments support create, get, update status
- Notifications support send and get by recipient
- Health supports `/health`, `/health/live`, `/health/ready`

Current gaps for a real dashboard:

- No dashboard summary endpoint
- No aggregated KPI endpoint
- No list endpoints for most admin screens
- No paginated/filterable admin read APIs
- No dashboard-specific DTOs or query models
- No unified operational timeline feed
- No backend support for low-stock summaries, status distributions, recent failures, or combined overview cards
- No users module with real admin user listing

Design the implementation around these realities instead of pretending full admin read APIs already exist.

## Product Goals

The real dashboard must allow an admin operator to:

- See top-level platform health and commerce KPIs immediately
- Monitor order flow across states
- Inspect inventory pressure and low-stock risk
- Review recent payments, refunds, and failures
- Track shipment progress and delayed/problem shipments
- Review notification activity
- View infrastructure health for database, Kafka, and Temporal
- Open detail screens and take operational actions from the UI

## Architecture Expectations

Follow the existing backend architecture style:

- Clean Architecture
- DDD-aligned module structure
- Thin controllers
- Application use cases
- Infrastructure repositories/adapters
- DTOs for API output

Do not stuff dashboard logic into existing controllers if a dedicated dashboard module is more appropriate.

Create a new backend module such as:

- `src/dashboard/dashboard.module.ts`

And organize it consistently, for example:

- `src/dashboard/application`
- `src/dashboard/presentation`
- `src/dashboard/infrastructure`

The dashboard module is a read-model / query module. It can read across multiple tables and bounded contexts for admin reporting purposes, but it should still respect the existing code quality and layering conventions.

## Backend Scope

Implement a dashboard module that exposes admin-oriented endpoints such as:

- `GET /api/v1/dashboard/overview`
- `GET /api/v1/dashboard/orders`
- `GET /api/v1/dashboard/orders/:id`
- `GET /api/v1/dashboard/inventory`
- `GET /api/v1/dashboard/payments`
- `GET /api/v1/dashboard/shipments`
- `GET /api/v1/dashboard/notifications`
- `GET /api/v1/dashboard/health`
- `GET /api/v1/dashboard/activity`

If useful, also add:

- query params for pagination, filtering, sorting, and date range
- specialized endpoints like low-stock, alerts, or status summaries

Example query capabilities:

- orders by status
- orders by date range
- inventory low stock only
- payments by status
- shipments by status/carrier
- notifications by channel/status
- recent activity limited feed

All dashboard endpoints should require admin access unless there is a clear reason otherwise.

## Data Contract Expectations

Design response payloads specifically for the frontend screens instead of leaking raw persistence models.

The overview response should include enough data for:

- KPI cards
- order trend chart
- order status distribution
- low-stock widget
- recent activity feed
- payments summary
- shipment summary
- notification summary
- infrastructure health summary

Example overview sections:

- `summary`
- `orderMetrics`
- `inventoryMetrics`
- `paymentMetrics`
- `shipmentMetrics`
- `notificationMetrics`
- `health`
- `recentActivity`

The detailed list endpoints should support data table rendering without additional frontend reshaping.

Each list response should be friendly for UI tables and detail drawers:

- display labels
- statuses
- timestamps
- IDs
- related entity references
- counts/totals
- pagination metadata where relevant

## Users Constraint

The MVP frontend includes a Users page, but the backend currently has authentication only and no true user management bounded context.

Do not invent a fake fully featured user service unless absolutely necessary.

Choose one pragmatic path and document it clearly in the implementation:

1. Keep `Users` as a placeholder/admin-insight page backed by auth/session-style minimal data only
2. Introduce a lightweight dashboard-scoped user read model with clearly limited scope
3. Temporarily defer real user management while preserving the route and UI shell

If user data is implemented, it must be framed honestly as limited admin identity/reporting support, not as a complete user domain.

## Frontend Scope

Refactor the MVP frontend to consume the real backend.

Replace mock-driven page state with:

- API clients
- loading states
- empty states
- error states
- filter/query state
- real status mapping from backend DTOs

Keep the visual direction of the MVP where it is strong, but make it product-ready:

- preserve the control-room feel
- remove demo-only assumptions
- replace fake labels like `OrderHub` if needed with `Flowmerce`
- make counts and charts driven by backend responses
- keep responsive behavior intact

Create a clear frontend data layer, for example:

- `src/lib/api`
- `src/features/dashboard`
- `src/features/orders`
- `src/features/inventory`

Use a maintainable structure rather than leaving API calls scattered through page components.

## Integration Expectations

The frontend should authenticate against the backend using the existing auth flow:

- `POST /api/v1/auth/login`

The implementation may use a temporary admin login bootstrap for local development, but it should be explicit and safe.

All dashboard pages should use real API responses where backend support exists.

If some pages must remain partial in the first iteration, prioritize this order:

1. Overview
2. Orders
3. Inventory
4. Payments
5. Shipments
6. Notifications
7. Health
8. Users

## Technical Requirements

Backend:

- Use NestJS conventions already present in Flowmerce
- Reuse Kysely and existing database modules
- Prefer explicit query services or repositories for dashboard reads
- Keep admin authorization enforced
- Add Swagger decorators for new endpoints
- Add DTOs for requests and responses
- Add focused tests for new use cases/controllers where practical

Frontend:

- Keep React + Vite setup
- Replace mock imports with real queries
- Centralize API configuration and types
- Support retry, loading, and failure UX
- Preserve accessible tables, drawers, dialogs, and filters

## Suggested Implementation Strategy

Phase 1:

- Add backend dashboard module
- Implement overview endpoint
- Implement health endpoint adapter
- Implement orders list/details endpoint
- Implement inventory list endpoint with low-stock support

Phase 2:

- Implement payments, shipments, notifications endpoints
- Wire frontend overview, orders, inventory, and health pages
- Replace major mock datasets

Phase 3:

- Add activity feed aggregation
- Improve filters and pagination
- Resolve users page strategy
- Add polish, test coverage, and documentation

## Expected Deliverables

Produce:

1. Backend dashboard module with real endpoints
2. Read-model DTOs for dashboard consumption
3. Query logic for overview and list pages
4. Frontend integration with real API data
5. Removal or isolation of obsolete mock data
6. Updated documentation for local development and dashboard API usage

## Acceptance Criteria

The work is successful when:

- The backend exposes a dedicated dashboard API module
- The overview page is backed by real backend data
- Orders, inventory, payments, shipments, notifications, and health pages are connected to real endpoints or explicitly marked as staged
- The dashboard can render loading, success, empty, and error states
- Admin authorization is respected
- The implementation matches the current Flowmerce architecture style
- The solution is honest about unsupported areas such as full user management

## Non-Goals

Do not:

- Build a fake enterprise analytics engine
- Invent non-existent data sources without clearly labeling them
- Break existing domain modules just to force dashboard support into them
- Over-engineer CQRS/event projections unless the current project truly needs that complexity

## Output Style For The Implementation Work

When implementing this prompt:

- explain the chosen backend API contract
- explain any tradeoffs around users/admin identity data
- keep changes modular and incremental
- prefer real, testable code over architectural theater
- keep the MVP’s strong visual design, but ground it in real data

## Short Summary

Turn Flowmerce plus the dashboard MVP into a real admin product by introducing a dashboard-oriented backend module and refactoring the frontend to consume read-optimized, admin-focused APIs for overview, orders, inventory, payments, shipments, notifications, and infrastructure health.
