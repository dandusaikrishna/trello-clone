# Trello Clone - Backend Implementation Guide

## Objective

Build a production-quality backend for a Trello-style Kanban application.

The backend must be implemented using:

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- REST API Architecture
- JWT Authentication

Authentication should be implemented using:

- Access Tokens
- Refresh Tokens
- HTTP-Only Cookies

Users must authenticate before accessing protected resources. Upon successful login, the backend should generate and set both access and refresh tokens as secure cookies. Every protected request must validate the authenticated user using the access token.

---

# Authentication Requirements

Implement JWT-based authentication.

## Login Flow

### Login Endpoint

```http
POST /api/v1/auth/login
```

Request

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

On successful login:

1. Validate user credentials.
2. Generate an access token.
3. Generate a refresh token.
4. Store the refresh token (or its hash) in the database.
5. Set both tokens as HTTP-only cookies.
6. Return authenticated user details.

Response

```json
{
  "success": true,
  "data": {
    "user": {}
  }
}
```

---

## Refresh Token Flow

### Refresh Access Token

```http
POST /api/v1/auth/refresh
```

The backend should:

1. Read the refresh token from cookies.
2. Validate the refresh token.
3. Verify it exists in the database.
4. Generate a new access token.
5. Optionally rotate the refresh token.
6. Update cookies.

---

## Logout

### Logout Endpoint

```http
POST /api/v1/auth/logout
```

The backend should:

1. Remove the refresh token from the database.
2. Clear authentication cookies.
3. Return a success response.

---

## Protected Routes

All application routes except authentication endpoints must be protected.

Create an authentication middleware:

```ts
authenticateUser;
```

Responsibilities:

- Read access token from cookies.
- Verify JWT signature.
- Validate token expiration.
- Attach authenticated user to request.
- Reject unauthorized requests.

Example:

```ts
req.user = {
  id: "user-id",
  email: "user@example.com",
};
```

---

## Cookie Configuration

Access Token Cookie

```ts
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
}
```

Refresh Token Cookie

```ts
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
}
```

---

## Token Lifetimes

Access Token

```txt
15 minutes
```

Refresh Token

```txt
7 days
```

---

# Architecture Requirements

Use a feature-based architecture.

```txt
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│
│   ├── config/
│   │   └── env.ts
│   │
│   ├── db/
│   │   └── prisma.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error-handler.ts
│   │   ├── not-found.ts
│   │   └── validate-request.ts
│   │
│   ├── shared/
│   │   ├── constants/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── modules/
│   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.types.ts
│   │   │   └── auth.validator.ts
│   │   │
│   │   ├── board/
│   │   ├── list/
│   │   ├── card/
│   │   ├── member/
│   │   ├── label/
│   │   ├── checklist/
│   │   ├── comment/
│   │   └── activity/
│   │
│   ├── routes/
│   │   └── index.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── package.json
├── tsconfig.json
└── .env
```

---

# Layer Responsibilities

## Controller

Responsible for:

- Reading request params
- Reading request body
- Reading authenticated user
- Calling services
- Sending response

Must NOT contain business logic.

---

## Service

Responsible for:

- Business logic
- Validations
- Authentication workflows
- Authorization checks
- Orchestration
- Transactions

Must NOT directly access Express Request or Response.

---

## Repository

Responsible for:

- Prisma queries
- Database operations

Must NOT contain business logic.

---

# API Response Format

Success Response

```json
{
  "success": true,
  "data": {}
}
```

List Response

```json
{
  "success": true,
  "data": []
}
```

Error Response

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

---

# Domain Models

## User

```ts
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Refresh Token

```ts
interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}
```

---

## Board

```ts
interface Board {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## List

```ts
interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
}
```

---

## Card

```ts
interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  dueDate?: string;
  position: number;
  status: "ACTIVE" | "ARCHIVED";
}
```

---

## Member

```ts
interface Member {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}
```

---

## Label

```ts
interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}
```

---

## Checklist

```ts
interface Checklist {
  id: string;
  cardId: string;
  title: string;
}
```

---

## Checklist Item

```ts
interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}
```

---

# Core API Endpoints

## Authentication APIs

### Login

```http
POST /api/v1/auth/login
```

---

### Refresh Token

```http
POST /api/v1/auth/refresh
```

---

### Logout

```http
POST /api/v1/auth/logout
```

---

## Board APIs

### Create Board

```http
POST /api/v1/boards
```

Request

```json
{
  "title": "Project Board"
}
```

---

### Get Board Details

Returns:

- board
- lists
- cards
- labels
- assigned members
- checklists

```http
GET /api/v1/boards/:boardId
```

---

### Get All Boards

```http
GET /api/v1/boards
```

---

# List APIs

## Create List

```http
POST /api/v1/lists
```

```json
{
  "boardId": "uuid",
  "title": "Todo"
}
```

---

## Update List

```http
PATCH /api/v1/lists/:listId
```

---

## Delete List

```http
DELETE /api/v1/lists/:listId
```

---

## Reorder Lists

```http
PATCH /api/v1/lists/reorder
```

```json
{
  "boardId": "uuid",
  "lists": [
    {
      "id": "uuid",
      "position": 1
    }
  ]
}
```

---

# Card APIs

## Create Card

```http
POST /api/v1/cards
```

```json
{
  "listId": "uuid",
  "title": "Implement Login"
}
```

---

## Update Card

```http
PATCH /api/v1/cards/:cardId
```

Supports:

- title
- description
- dueDate

---

## Delete Card

```http
DELETE /api/v1/cards/:cardId
```

---

## Archive Card

```http
PATCH /api/v1/cards/:cardId/archive
```

---

## Move Card

Supports:

- same list reorder
- cross list movement

```http
PATCH /api/v1/cards/move
```

Request

```json
{
  "cardId": "uuid",
  "sourceListId": "uuid",
  "destinationListId": "uuid",
  "newPosition": 1
}
```

---

# Label APIs

## Create Label

```http
POST /api/v1/labels
```

---

## Assign Label To Card

```http
POST /api/v1/cards/:cardId/labels
```

```json
{
  "labelId": "uuid"
}
```

---

## Remove Label From Card

```http
DELETE /api/v1/cards/:cardId/labels/:labelId
```

---

# Member APIs

## Get Members

```http
GET /api/v1/members
```

---

## Assign Member

```http
POST /api/v1/cards/:cardId/members
```

```json
{
  "memberId": "uuid"
}
```

---

## Remove Member

```http
DELETE /api/v1/cards/:cardId/members/:memberId
```

---

# Checklist APIs

## Create Checklist

```http
POST /api/v1/cards/:cardId/checklists
```

---

## Add Checklist Item

```http
POST /api/v1/checklist-items
```

---

## Update Checklist Item

```http
PATCH /api/v1/checklist-items/:itemId
```

Supports:

- title
- isCompleted

---

## Delete Checklist Item

```http
DELETE /api/v1/checklist-items/:itemId
```

---

# Search APIs

## Search Cards

```http
GET /api/v1/cards/search?query=login
```

Search by:

- title

---

# Filter APIs

## Filter Cards

```http
GET /api/v1/cards/filter
```

Query Params

```txt
labelId
memberId
dueDate
boardId
```

---

# Validation

Use Zod.

Example:

```ts
const CreateCardSchema = z.object({
  listId: z.string().uuid(),
  title: z.string().min(1).max(255),
});
```

All request payloads must be validated.

---

# Prisma Requirements

Use:

- Prisma Client
- Prisma Migrations
- Seed Script

Commands

```bash
npx prisma migrate dev

npx prisma generate

npx prisma db seed
```

---

# Error Handling

Create centralized error middleware.

Requirements:

- Validation Errors
- Authentication Errors
- Authorization Errors
- Prisma Errors
- Not Found Errors
- Internal Server Errors

---

# Logging

Use Morgan.

```bash
npm install morgan
```

Requirements:

- Request Method
- URL
- Response Status
- Duration

---

# Seed Data

Create:

Users

```txt
228r5a0407@gmail.com
john@example.com
alice@example.com
```

Board

```txt
Personal Project
```

Lists

```txt
Todo
In Progress
Review
Done
```

Members

```txt
Sai Krishna Dandu
John
Alice
```

Labels

```txt
Bug
Feature
Review
High Priority
```

Cards

Create sample cards in each list.

---

# Non Functional Requirements

- TypeScript Strict Mode
- Repository Pattern
- Service Layer Pattern
- JWT Authentication
- Access Token & Refresh Token Flow
- HTTP-Only Cookie-Based Authentication
- Protected Routes
- RESTful APIs
- Consistent Response Structure
- Prisma Transactions for Reordering
- Proper Error Handling
- Input Validation
- Clean Folder Structure
- Modular Feature-Based Architecture

Generate all code following these requirements.
