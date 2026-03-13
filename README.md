# ChaCho

ChaCho is a multi-tenant embeddable chat platform. This repository is set up as a monorepo, which means one repository holds multiple related apps and shared packages.

## What is in this repo

- `apps/dashboard`: the internal web app used by business owners and agents
- `apps/widget`: the chat interface that visitors will see on a website
- `packages/db`: the database schema and migrations
- `packages/types`: shared TypeScript types used across apps
- `packages/validation`: shared request validation rules
- `Docs/mvp-engineering-spec.md`: the written product and architecture spec

## What we have done so far

We created the backbone of the project.

- The dashboard app has a starter homepage.
- The dashboard now has a working sign-in flow with a secure cookie session.
- The widget app has a starter preview UI.
- The widget preview can now create a conversation and send visitor messages into the shared chat store.
- The protected dashboard now shows a real inbox view and lets the agent reply.
- The database package defines the main tables for tenants, users, widgets, conversations, and messages.
- The first SQL migration shows how those tables will be created in PostgreSQL.

## Why this order matters

It is tempting to start by building screens, but that usually creates rework. We started with the project structure and database shape because those decisions affect almost every feature that comes later.

## Next build step

The next useful milestone is to replace the development store with PostgreSQL:

- connect a real Postgres database
- run the first migration
- seed the first tenant, owner, and widget
- swap the remaining dev-only fallback paths to database-backed reads and writes

That will move the app from local prototype mode into a real backend-backed MVP foundation.
