# Dashboard Front Design Prompt

Create a beautiful, modern admin dashboard UI concept for a distributed order management platform. This is a frontend design prompt, not backend code. The result should feel production-ready, premium, and highly usable for operators who manage users, inventory, orders, shipments, payments, notifications, and infrastructure health.

## Product Context

This project is a distributed order system with these backend capabilities:

- Authentication with role-based access for `admin`, `customer`, and `service`
- Order lifecycle management
- Inventory lookup, reservation, and release
- Payment processing and refunds
- Shipment creation and shipment status updates
- Notification sending and notification history
- Infrastructure health monitoring for PostgreSQL database, Kafka, and Temporal
- Health endpoints for full system status, liveness, and readiness

The dashboard is primarily for `admin` users and operations teams.

## Core Goal

Design an admin dashboard frontend that gives operators one powerful control center where they can:

- Monitor all users and switch between user views or inspect user activity
- Manage inventory items and stock levels
- Track order statuses across the full lifecycle
- Perform key actions such as confirm order, cancel order, reserve inventory, release inventory, process refund, create shipment, and update shipment status
- View notifications and trigger manual notifications
- Monitor infrastructure health for database, Kafka, and Temporal
- Understand system state quickly through strong visual hierarchy, status colors, charts, alerts, and live operational widgets

## Design Direction

Make the UI bold, elegant, clean, and slightly futuristic without becoming noisy. Avoid generic SaaS templates. The interface should feel like a high-end control room for commerce operations.

Use:

- Strong typography with personality
- Layered surfaces, gradients, subtle glows, glass panels, or soft depth where appropriate
- A refined color system with excellent status signaling
- Clear data density for power users
- Beautiful but purposeful charts, tables, filters, and activity feeds
- Responsive layouts for desktop first, with strong tablet and mobile behavior

Avoid:

- Plain bootstrap-style dashboards
- Flat and lifeless white screens
- Random neon overload
- Weak contrast or unreadable dense tables
- Generic placeholder cards with no meaningful information architecture

## Required Screens / Sections

Include these dashboard sections in the design:

### 1. Overview Dashboard

Show a command-center style landing page with:

- Total users
- Active customers
- Orders today
- Orders by status
- Inventory alerts
- Payments processed
- Failed or cancelled flows
- Shipment progress summary
- Notification activity
- System health summary

Add charts and widgets such as:

- Order volume trend
- Order status distribution
- Inventory low-stock list
- Recent activity timeline
- Live health status cards for Database, Kafka, and Temporal

### 2. Users Management

Design a users section that supports:

- User list with search, filter, and role badges
- Admin, customer, and service roles
- User profile drawer or detail panel
- Activity summary for each user
- Recent orders and notifications for a selected user

### 3. Orders Management

Design a rich orders page with:

- Searchable and filterable orders table
- Status badges for `PENDING`, `INVENTORY_RESERVED`, `PAYMENT_PROCESSED`, `CONFIRMED`, `SHIPPED`, and `CANCELLED`
- Order detail panel with timeline or stepper
- Customer info
- Items purchased
- Shipping address
- Payment state
- Shipment state
- Available admin actions:
  - Confirm order
  - Cancel order
  - View workflow progress

### 4. Inventory Management

Create inventory management views that include:

- SKU table
- Product name
- Current quantity
- Reserved quantity
- Availability state
- Low stock highlighting
- Quick actions:
  - Reserve inventory
  - Release inventory
  - Inspect item history

### 5. Payments and Refunds

Show payment operations with:

- Payment list
- Payment detail card
- Amount and currency
- Payment method summary
- Payment status
- Refund action
- Failure and retry states if useful

### 6. Shipments

Design a shipment center with:

- Shipment list
- Tracking number
- Carrier
- Shipment status
- Delivery progress
- Map-style or route-inspired visual if it improves the design
- Actions:
  - Create shipment
  - Update shipment status

### 7. Notifications

Include a notification management section with:

- Notification history feed
- Recipient
- Channel
- Type
- Status
- Manual send notification action
- Templates or quick-send cards if helpful

### 8. Infrastructure Health

This section is very important. Create a beautiful health monitoring area that visualizes:

- Database health
- Kafka health
- Temporal health
- Liveness status
- Readiness status
- Response times
- Error states
- Degraded states

Use elegant status cards, pulse indicators, uptime blocks, small charts, and incident banners. The health area should feel trustworthy and immediately scannable.

## UX Requirements

The design should include:

- Left sidebar or another strong primary navigation pattern
- Top bar with search, notifications, environment indicator, and current user
- Filters, tabs, drawers, modals, and action menus
- Empty states, loading states, success states, and error states
- Dense but readable data tables
- Responsive behavior for desktop, tablet, and mobile
- Accessibility-aware contrast and clear visual states

## Visual System Requirements

Provide a complete visual language including:

- Color palette
- Typography pairings
- Card and panel styles
- Button hierarchy
- Status badge system
- Chart styling guidance
- Table styling guidance
- Form and modal style direction
- Light mode or dark mode, but make the choice intentional and polished

## Output Format

Generate:

1. A full dashboard design concept
2. The main overview page
3. At least one detailed management screen for orders
4. At least one detailed management screen for inventory
5. A dedicated infrastructure health monitoring screen
6. Reusable UI style guidance for the whole dashboard

## Quality Bar

The final design should feel like a premium operations dashboard for a distributed commerce system. It must balance beauty with real operational clarity. Every panel should feel useful. The health monitoring section should be especially striking and readable, because database, Kafka, and Temporal visibility is a core part of this system.
