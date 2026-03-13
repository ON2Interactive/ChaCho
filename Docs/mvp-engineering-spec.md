# ChaCho MVP Engineering Spec

## 1. Objective

Build a multi-tenant embeddable chat platform that lets a business:

- create a tenant account
- configure a chat widget
- install a single embed script on their website
- receive website conversations in a dashboard
- reply to visitors from the dashboard

The MVP succeeds if a tenant can go from signup to live chat installation without engineering help beyond copying a script tag.

## 2. Product Scope

### In scope

- multi-tenant dashboard for tenant staff
- embeddable website widget
- hosted embed bootstrap script
- chat backend with message persistence
- basic near-real-time message delivery
- widget branding and install flow
- tenant-scoped auth and access control

### Out of scope

- AI agent behavior
- billing and subscriptions
- file uploads
- chatbot automations
- advanced analytics
- native mobile SDKs
- omnichannel support
- macros, tags, SLAs, routing rules

## 3. Recommended Stack

The stack should optimize for speed, simplicity, and operational clarity.

### Application stack

- `Next.js` for the dashboard app and internal API surface
- `React` for dashboard UI
- `TypeScript` across dashboard, widget, and backend
- `PostgreSQL` as the primary database
- `Prisma` or `Drizzle` as the ORM
- `NextAuth` or a simple first-party auth layer with magic link/email-password
- `SSE` for live updates in MVP
- `pnpm` monorepo for app, widget, and shared packages

### Deployment shape

- dashboard app hosted on Vercel or a similar app platform
- PostgreSQL on Neon, Supabase, RDS, or equivalent
- embed script and widget assets on a CDN-backed domain
- one primary API domain, for example `api.chacho.com`

### Why this stack

- one TypeScript stack reduces coordination cost
- PostgreSQL fits relational tenant data and conversation history well
- SSE is simpler than WebSockets for early-stage support tooling
- monorepo keeps shared types and validation close to implementation

## 4. System Architecture

There are four runtime surfaces.

### Dashboard

Used by tenant staff to:

- authenticate
- configure widget settings
- view conversations
- reply to visitors
- close conversations

### Widget

Runs in an iframe injected by the embed script. It:

- renders launcher and panel UI
- creates or restores a visitor session
- fetches widget config
- sends messages
- receives new messages via SSE or polling fallback

### Embed script

A small bootstrap script loaded on the tenant website. It:

- reads a public widget key from `window.ChaCho`
- validates basic initialization inputs
- injects a fixed-position iframe
- passes host page context to the widget

### API/backend

Handles:

- tenant/user authentication for dashboard
- widget config resolution from public widget key
- visitor session creation
- conversation/message persistence
- tenant authorization
- live event streams

## 5. Monorepo Layout

```text
/apps
  /dashboard        # Next.js dashboard
  /widget           # embeddable widget app
  /api              # optional separate API app if not using dashboard API routes
/packages
  /db               # schema, migrations, seeders
  /types            # shared types
  /validation       # zod schemas
  /ui               # shared primitives if needed
  /sdk              # embed bootstrap helpers
/infra
  /env              # environment examples
/Docs
  mvp-engineering-spec.md
```

For MVP, combining dashboard and API inside one Next.js app is acceptable. The widget should still be its own app bundle because it has a different runtime and release cadence.

## 6. Multi-Tenant Model

Tenant isolation is a non-negotiable design constraint.

### Isolation rules

- every tenant-owned record includes `tenant_id`
- dashboard queries must always scope by both authenticated user membership and `tenant_id`
- widget requests never receive tenant identity from the browser as truth
- widget access resolves through `widgets.public_key`
- all writes derive `tenant_id` server-side from the resolved widget or dashboard session

### Core entities

- `tenants`
- `users`
- `memberships`
- `widgets`
- `visitors`
- `conversations`
- `messages`
- `conversation_events` optional for audit/history in MVP+

## 7. Database Schema

### tenants

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| name | text | display name |
| slug | text | unique |
| status | text | `active`, `suspended`, `trial` |
| created_at | timestamptz | default now |
| updated_at | timestamptz | default now |

### users

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| email | text | unique |
| name | text | nullable |
| password_hash | text | nullable if magic link only |
| created_at | timestamptz | default now |
| updated_at | timestamptz | default now |

### memberships

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| tenant_id | uuid | fk tenants |
| user_id | uuid | fk users |
| role | text | `owner`, `agent` |
| created_at | timestamptz | default now |

Unique index:

- `(tenant_id, user_id)`

### widgets

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| tenant_id | uuid | fk tenants |
| name | text | internal label |
| public_key | text | unique public identifier |
| domain_allowlist | jsonb | array of domains |
| theme_json | jsonb | widget config |
| is_active | boolean | default true |
| created_at | timestamptz | default now |
| updated_at | timestamptz | default now |

### visitors

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| tenant_id | uuid | fk tenants |
| widget_id | uuid | fk widgets |
| browser_token | text | stable anonymous browser/session id |
| name | text | nullable |
| email | text | nullable |
| first_seen_at | timestamptz | default now |
| last_seen_at | timestamptz | default now |

Indexes:

- `(tenant_id, widget_id)`
- `(tenant_id, browser_token)`

### conversations

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| tenant_id | uuid | fk tenants |
| widget_id | uuid | fk widgets |
| visitor_id | uuid | fk visitors |
| status | text | `open`, `closed` |
| source_url | text | landing or current page |
| source_title | text | nullable |
| started_at | timestamptz | default now |
| last_message_at | timestamptz | default now |
| closed_at | timestamptz | nullable |

Indexes:

- `(tenant_id, status, last_message_at desc)`
- `(tenant_id, visitor_id)`

### messages

| column | type | notes |
|---|---|---|
| id | uuid | primary key |
| tenant_id | uuid | fk tenants |
| conversation_id | uuid | fk conversations |
| sender_type | text | `visitor`, `agent`, `system` |
| sender_user_id | uuid | fk users, nullable |
| body | text | plain text for MVP |
| created_at | timestamptz | default now |

Indexes:

- `(tenant_id, conversation_id, created_at asc)`

## 8. Authentication and Authorization

### Dashboard auth

MVP recommendation:

- email/password if speed matters most
- magic link if lower friction matters more

Either is acceptable. The key is tenant membership enforcement after login.

Authorization rules:

- a dashboard user can only access tenants where a membership exists
- `owner` can manage widget settings and team membership
- `agent` can read and reply to conversations but not manage tenant settings

### Widget auth

The widget is public-facing. It should use:

- `public_key` for widget lookup
- a signed `visitor_token` or opaque session token for message continuity

The visitor token should identify the browser session, not grant tenant-wide access.

## 9. Widget Boot Flow

### Host page install

```html
<script>
  window.ChaCho = {
    widgetKey: "wpk_live_123",
  };
</script>
<script async src="https://cdn.chacho.com/widget.js"></script>
```

### Boot sequence

1. `widget.js` reads `window.ChaCho.widgetKey`
2. script injects iframe shell into the page
3. iframe app loads with `widgetKey` and host metadata
4. widget calls `GET /public/widget/:widgetKey/config`
5. widget calls `POST /public/widget/:widgetKey/session`
6. backend creates or restores visitor
7. widget loads the active conversation or creates one on first message
8. widget subscribes to conversation updates via SSE

### Host metadata passed to backend

- page URL
- page title
- referrer
- browser locale
- viewport hint optional

## 10. API Contract

All public widget endpoints live under `/public`. All authenticated tenant endpoints live under `/app`.

### Public widget endpoints

#### `GET /public/widget/:widgetKey/config`

Returns:

```json
{
  "widget": {
    "id": "uuid",
    "name": "Main Site Widget",
    "theme": {
      "primaryColor": "#111111",
      "position": "right",
      "title": "Chat with us",
      "subtitle": "We usually reply within a few minutes."
    }
  }
}
```

Rules:

- reject inactive widgets
- optionally reject requests from non-allowlisted domains

#### `POST /public/widget/:widgetKey/session`

Request:

```json
{
  "browserToken": "browser_abc",
  "page": {
    "url": "https://tenant.com/pricing",
    "title": "Pricing",
    "referrer": "https://google.com"
  },
  "visitor": {
    "name": null,
    "email": null
  }
}
```

Response:

```json
{
  "visitorToken": "signed_or_opaque_token",
  "visitorId": "uuid",
  "conversationId": "uuid_or_null"
}
```

#### `GET /public/conversations/:conversationId/messages`

Auth:

- requires `visitorToken`

Returns ordered messages for the active visitor conversation.

#### `POST /public/conversations/:conversationId/messages`

Auth:

- requires `visitorToken`

Request:

```json
{
  "body": "Hello, I need help with pricing."
}
```

Behavior:

- create conversation if needed before first message, or create via separate endpoint if preferred
- append message
- bump `last_message_at`
- trigger event stream update

#### `GET /public/conversations/:conversationId/stream`

Returns an SSE stream of new messages and conversation state changes.

Fallback if SSE is not available:

- widget polls `GET /messages?after=timestamp`

### Dashboard endpoints

#### `GET /app/conversations`

Query params:

- `status=open|closed`
- `cursor`
- `limit`

Returns tenant-scoped conversation list ordered by `last_message_at desc`.

#### `GET /app/conversations/:conversationId`

Returns conversation detail with visitor metadata and messages.

#### `POST /app/conversations/:conversationId/messages`

Request:

```json
{
  "body": "Happy to help. What volume are you expecting?"
}
```

Behavior:

- sender is the authenticated agent
- append message
- update conversation timestamps
- publish stream event

#### `POST /app/conversations/:conversationId/close`

Closes a conversation.

#### `GET /app/widget`

Returns the tenant widget config.

#### `PATCH /app/widget`

Updates tenant widget settings.

Fields:

- `title`
- `subtitle`
- `primaryColor`
- `position`
- `logoUrl`
- `domainAllowlist`
- `isActive`

## 11. Realtime Strategy

MVP recommendation:

- use SSE from server to widget and dashboard
- use standard POST requests to send messages
- use polling as fallback only

Why:

- simpler infra than WebSockets
- easy to reason about for one-to-many updates
- enough for low to moderate MVP traffic

Migration path later:

- abstract event publishing behind an interface so WebSockets can replace SSE without changing message persistence

## 12. Security Requirements

### Public-facing controls

- widget lookup by public key only
- domain allowlist validation
- request rate limiting by IP and widget
- message body length limits
- anti-spam cooldown on public message sends
- no secrets in embed script

### Tenant-facing controls

- secure session cookies for dashboard auth
- server-enforced tenant scoping
- role checks on settings endpoints
- audit logging for conversation close and widget config updates

### Data controls

- encrypt database at rest through provider defaults
- avoid storing unnecessary PII
- support hard delete for tenant test data

## 13. Dashboard Screens

### Inbox

Shows:

- conversation list
- unread/open state
- last message preview
- visitor name or anonymous label
- last activity time

### Conversation detail

Shows:

- transcript
- visitor metadata
- source page URL
- reply composer
- close conversation action

### Widget settings

Fields:

- widget name
- title
- subtitle
- primary color
- launcher position
- logo/avatar URL
- active toggle
- domain allowlist

### Install screen

Shows:

- widget public key
- copyable script snippet
- domain setup guidance

## 14. Widget UX Requirements

### Required behavior

- launcher visible on allowed pages
- panel open/close state persisted per page session
- history restored when visitor returns in same browser
- send on enter
- disabled state while sending
- connection error fallback messaging

### Optional for MVP if time allows

- pre-chat name/email capture
- unread badge when agent replies

### Explicitly later

- attachments
- emoji/reactions
- typing indicators
- read receipts
- multiple conversations per visitor

## 15. Operational Requirements

### Environments

- local
- staging
- production

### Logging

Track:

- widget bootstrap failures
- public API errors
- failed auth attempts
- message send failures
- SSE disconnect rates

### Basic admin capability

Even if not user-facing, keep a manual path for:

- suspending a tenant
- disabling a widget
- inspecting stuck conversations

## 16. Rollout Plan

### Phase 0: foundation

- monorepo setup
- database schema and migrations
- tenant/user/membership auth
- seed script for first tenant

Exit criteria:

- owner can log in and access only their tenant

### Phase 1: widget bootstrap

- CDN-served embed script
- iframe widget shell
- widget config endpoint
- visitor session creation

Exit criteria:

- widget appears on a test site and loads tenant config

### Phase 2: messaging core

- conversation creation
- message persistence
- visitor send flow
- dashboard inbox read flow

Exit criteria:

- visitor messages appear in the dashboard

### Phase 3: agent reply loop

- agent reply endpoint
- widget live update via SSE
- close conversation flow

Exit criteria:

- full two-way chat works end to end

### Phase 4: hardening

- rate limiting
- domain allowlist enforcement
- retry and error states
- audit logs
- staging validation with 2-3 pilot tenants

Exit criteria:

- ready for private beta

## 17. First Sprint Breakdown

### Sprint 1

- initialize monorepo
- set up Next.js dashboard app
- set up PostgreSQL connection and migration tooling
- create core schema
- implement dashboard auth
- implement tenant membership middleware

### Sprint 2

- build widget app shell
- build embed bootstrap script
- implement public widget config endpoint
- implement visitor session creation

### Sprint 3

- implement conversations/messages backend
- build dashboard inbox list and transcript view
- build widget send message flow

### Sprint 4

- implement SSE stream
- build agent reply flow
- add widget settings and install screen
- add rate limiting and basic audit logging

## 18. Open Decisions To Resolve Before Coding

These should be decided once before implementation starts:

1. Dashboard auth mode: magic link or email/password
2. ORM: Prisma or Drizzle
3. App split: single Next.js app with API routes, or separate API service
4. Deployment targets: Vercel plus managed Postgres is the default recommendation
5. Realtime fallback: polling interval and SSE reconnection behavior

Recommended defaults:

1. email/password
2. Prisma
3. single Next.js app plus separate widget app
4. Vercel plus Neon
5. SSE with 5-10 second polling fallback

## 19. Immediate Next Build Step

If we start implementation now, the first coded milestone should be:

- monorepo scaffold
- dashboard app
- widget app
- shared database package
- first migration for tenants, users, memberships, widgets, visitors, conversations, messages

That gives the project a stable backbone before UI work expands the surface area.
