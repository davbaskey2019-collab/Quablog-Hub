# Quablog Workspace

## Overview

A full-stack Q&A + Blogging platform built on a pnpm workspace monorepo. Quablog is a hybrid of a Quora-like Q&A system and a professional blogging platform.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

### Q&A System
- Post questions with title, body, category, tags
- Answer questions with voting (upvote/downvote)
- Mark "Best Answer" (question author only)
- View counts, vote counts, answer counts
- Real-time search and category filtering

### Blog System
- Long-form blog posts with cover images
- Rich reading layout with estimated read time
- Draft/published status
- Category and search filtering

### Categories
Technology, Science, Lifestyle, Education, Health, Entertainment, Business

### Admin Dashboard (`/admin`)
- **Overview**: Platform stats (users, questions, answers, blogs, daily counts)
- **User Management**: View, block/unblock, delete users
- **Content Moderation**: View, delete questions and blog posts
- **Site Settings**: Upload logo and favicon, update site name and tagline
- **Admin Profile**: Update email and change password

### Authentication
- JWT stored in localStorage as `quablog_token`
- Auto-injected in all API requests via custom fetch
- Role-based access (user/admin)
- Protected routes

## Default Admin Credentials
- Email: `admin@quablog.com`
- Password: `admin123`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── quablog/            # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks (+ JWT injection)
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `users` — User accounts (id, username, email, passwordHash, displayName, bio, avatarUrl, role, isBlocked)
- `questions` — Q&A questions (id, title, body, category, tags, votes, viewCount, answerCount, hasBestAnswer, authorId)
- `answers` — Answers to questions (id, body, votes, isBest, questionId, authorId)
- `votes` — Vote tracking (userId, targetId, targetType: 'question'|'answer', vote: 1|-1)
- `blogs` — Blog posts (id, title, slug, excerpt, content, coverImageUrl, category, tags, status, readTime, authorId)
- `site_settings` — Site branding (siteName, tagline, logoUrl, faviconUrl)

## API Routes

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Current user
- `GET /api/users` — List users (admin)
- `PATCH /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user (admin)
- `POST /api/users/:id/block` — Block/unblock (admin)
- `GET /api/questions` — List questions (with search, category, sort)
- `POST /api/questions` — Create question
- `GET /api/questions/:id` — Get question + answers
- `POST /api/questions/:id/vote` — Vote on question
- `POST /api/questions/:questionId/answers` — Post answer
- `POST /api/answers/:id/vote` — Vote on answer
- `POST /api/answers/:id/best` — Mark best answer
- `GET /api/blogs` — List blogs
- `POST /api/blogs` — Create blog post
- `GET /api/blogs/:id` — Get blog post
- `POST /api/upload/image` — Upload image (multipart)
- `GET /api/settings` — Site settings
- `PATCH /api/settings` — Update settings (admin)
- `GET /api/admin/stats` — Platform stats (admin)
- `PATCH /api/admin/profile` — Update admin profile

## File Upload

Uploaded files stored locally in `artifacts/api-server/uploads/` and served at `/api/uploads/<filename>`.
Types: avatar, blog (cover), logo, favicon.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.
- Always typecheck from the root: `pnpm run typecheck`
- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Push DB schema: `pnpm --filter @workspace/db run push`
