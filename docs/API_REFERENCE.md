# Trello Clone — API Reference

Frontend integration guide for the REST API. All endpoints below reflect the **current backend implementation**.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Envelope](#response-envelope)
4. [Error Handling](#error-handling)
5. [Shared Types](#shared-types)
6. [Health Check](#health-check)
7. [Auth Endpoints](#auth-endpoints)
8. [Workspace Endpoints](#workspace-endpoints)
9. [Board Endpoints](#board-endpoints)
10. [Board Member Endpoints](#board-member-endpoints)
11. [Board Star Endpoints](#board-star-endpoints)
12. [List Endpoints](#list-endpoints)
13. [Card Endpoints](#card-endpoints)
14. [Comment Endpoints](#comment-endpoints)
15. [Attachment Endpoints](#attachment-endpoints)
16. [Label Endpoints](#label-endpoints)
17. [Member Endpoints](#member-endpoints)
18. [Checklist Endpoints](#checklist-endpoints)
19. [Checklist Item Endpoints](#checklist-item-endpoints)
20. [Frontend Integration Notes](#frontend-integration-notes)

---

## Overview

| Property | Value |
|---|---|
| **Base URL** | `http://localhost:5000` (default; configurable via `PORT`) |
| **API prefix** | `/api/v1` |
| **Content-Type** | `application/json` for request bodies |
| **Auth mechanism** | HTTP-only cookies (`accessToken`, `refreshToken`) |
| **CORS** | Credentials enabled; origin from `CORS_ORIGIN` env (default `http://localhost:5173`) |

### Route protection

| Route group | Auth required |
|---|---|
| `GET /health` | No |
| `POST /api/v1/auth/login` | No |
| `POST /api/v1/auth/refresh` | No (uses refresh cookie) |
| `POST /api/v1/auth/logout` | No (clears cookies if present) |
| All other `/api/v1/*` routes | **Yes** — valid `accessToken` cookie required |

> **Note:** There is no user registration endpoint. Users must exist in the database before login.

---

## Authentication

Tokens are stored in **HTTP-only cookies** and are **not** returned in response bodies (except user info on login).

| Cookie | Name | Lifetime | Purpose |
|---|---|---|---|
| Access token | `accessToken` | 15 minutes | Authenticates protected API requests |
| Refresh token | `refreshToken` | 7 days | Renews the access token |

### Cookie attributes

```
httpOnly: true
secure:   true (production only)
sameSite: lax
```

### Frontend fetch setup

Always send cookies with API requests:

```ts
fetch("http://localhost:5000/api/v1/boards", {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
});
```

### Token refresh strategy

1. On `401` with message `"Invalid or expired access token"`, call `POST /api/v1/auth/refresh`.
2. If refresh succeeds, retry the original request.
3. If refresh fails, redirect to login.

---

## Response Envelope

Every API response uses a consistent wrapper.

### Success

```json
{
  "success": true,
  "data": { }
}
```

| Field | Type | Always present |
|---|---|---|
| `success` | `boolean` | Yes — always `true` |
| `data` | `object \| array` | Yes — payload varies per endpoint |

HTTP status is typically `200 OK` or `201 Created`.

### Error

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

| Field | Type | Always present |
|---|---|---|
| `success` | `boolean` | Yes — always `false` |
| `message` | `string` | Yes |

There is **no** `errors` array or error code field in the current implementation.

---

## Error Handling

### HTTP status codes

| Status | When |
|---|---|
| `400 Bad Request` | Validation failure (Zod), empty update body, business rule violation |
| `401 Unauthorized` | Missing/invalid/expired token, bad login credentials |
| `403 Forbidden` | Authenticated but no access to the resource (e.g. board not owned) |
| `404 Not Found` | Resource or route not found |
| `409 Conflict` | Unique constraint violation (e.g. duplicate assignment) |
| `500 Internal Server Error` | Unexpected server error |

### Common error messages

| Message | Status | Trigger |
|---|---|---|
| `Authentication required` | 401 | Protected route called without `accessToken` cookie |
| `Invalid or expired access token` | 401 | Access token invalid or expired |
| `Invalid email or password` | 401 | Wrong login credentials |
| `Refresh token required` | 401 | `POST /auth/refresh` without refresh cookie |
| `Invalid or expired refresh token` | 401 | Refresh token JWT invalid |
| `Invalid refresh token` | 401 | Refresh token not found or hash mismatch |
| `Refresh token expired` | 401 | Refresh token past expiry |
| `You do not have access to this board` | 403 | User lacks board membership / visibility |
| `You do not have access to this workspace` | 403 | User is not a workspace member |
| `You do not have permission to manage this workspace` | 403 | Non-admin workspace action |
| `User must be a board member to be assigned to a card` | 400 | Card assignee not on board |
| `User is not a member of this workspace` | 400 | Board member invite outside workspace |
| `Workspace not found` | 404 | Workspace ID does not exist |
| `Comment not found` | 404 | Comment ID does not exist |
| `Attachment not found` | 404 | Attachment ID does not exist |
| `Board not found` | 404 | Board ID does not exist |
| `List not found` | 404 | List ID does not exist |
| `Card not found` | 404 | Card ID does not exist |
| `Member not found` | 404 | User ID does not exist |
| `Label not found on this board` | 404 | Label missing or belongs to another board |
| `Checklist not found` | 404 | Checklist ID does not exist |
| `Checklist item not found` | 404 | Checklist item ID does not exist |
| `No fields to update` | 400 | PATCH body has no updatable fields |
| `Card is not in the source list` | 400 | Move card source mismatch |
| `Lists must belong to the same board` | 400 | Cross-board card move attempted |
| `Failed to move card` | 400 | Card move transaction failed |
| `Resource not found` | 404 | Prisma P2025 (record not found) |
| `Resource already exists` | 409 | Prisma P2002 (unique constraint) |
| `Route not found` | 404 | Unknown URL |
| `Something went wrong` | 500 | Unhandled server error |

### Validation errors (400)

Request body, params, and query are validated with Zod. Multiple issues are joined into a single `message` string:

```json
{
  "success": false,
  "message": "Invalid email, String must contain at least 1 character(s)"
}
```

---

## Shared Types

### `User` (auth / member response)

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `name` | `string` | Yes | |
| `email` | `string` | Yes | |
| `avatarUrl` | `string` | No | Omitted when `null` |

### `Workspace`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `name` | `string` | Yes | |
| `slug` | `string` | Yes | URL-safe unique identifier |
| `createdAt` | `string` (ISO 8601) | Yes | |
| `updatedAt` | `string` (ISO 8601) | Yes | |

### `WorkspaceMember`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `userId` | `string` (UUID) | Yes | |
| `role` | `"OWNER" \| "ADMIN" \| "MEMBER"` | Yes | |
| `joinedAt` | `string` (ISO 8601) | Yes | |
| `user` | `User` | Yes | Nested user object |

### `BoardMember`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `userId` | `string` (UUID) | Yes | |
| `role` | `"ADMIN" \| "MEMBER" \| "OBSERVER"` | Yes | |
| `joinedAt` | `string` (ISO 8601) | Yes | |
| `user` | `User` | Yes | Nested user object |

### `Board`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `title` | `string` | Yes | |
| `ownerId` | `string` (UUID) | Yes | |
| `workspaceId` | `string` (UUID) | Yes | |
| `visibility` | `"PRIVATE" \| "WORKSPACE" \| "PUBLIC"` | Yes | Default `WORKSPACE` |
| `isClosed` | `boolean` | Yes | Default `false` |
| `isStarred` | `boolean` | No | Present on list responses when applicable |
| `backgroundColor` | `string` | No | Hex color |
| `backgroundImageUrl` | `string` | No | Image URL |
| `createdAt` | `string` (ISO 8601) | Yes | |
| `updatedAt` | `string` (ISO 8601) | Yes | |

### `List`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `boardId` | `string` (UUID) | Yes | |
| `title` | `string` | Yes | |
| `position` | `number` (integer, ≥ 0) | Yes | 1-based ordering within board |
| `status` | `"ACTIVE" \| "ARCHIVED"` | Yes | Default `ACTIVE` |
| `archivedAt` | `string` (ISO 8601) | No | Set when archived |
| `createdAt` | `string` (ISO 8601) | Yes | |
| `updatedAt` | `string` (ISO 8601) | Yes | |

### `Card`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `listId` | `string` (UUID) | Yes | |
| `title` | `string` | Yes | |
| `description` | `string` | No | Omitted when `null` |
| `startDate` | `string` (ISO 8601) | No | Omitted when `null` |
| `dueDate` | `string` (ISO 8601) | No | Omitted when `null` |
| `dueComplete` | `boolean` | Yes | Default `false` |
| `coverColor` | `string` | No | Hex color |
| `coverAttachmentId` | `string` (UUID) | No | References an attachment on this card |
| `position` | `number` (integer) | Yes | 1-based ordering within list |
| `status` | `"ACTIVE" \| "ARCHIVED"` | Yes | |
| `createdAt` | `string` (ISO 8601) | Yes | |
| `updatedAt` | `string` (ISO 8601) | Yes | |

### `Label`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `boardId` | `string` (UUID) | Yes | |
| `name` | `string` | Yes | |
| `color` | `string` | Yes | Hex color, e.g. `"#61bd4f"` |
| `createdAt` | `string` (ISO 8601) | Yes | |
| `updatedAt` | `string` (ISO 8601) | Yes | |

Suggested palette (from backend constants): `#61bd4f`, `#f2d600`, `#ff9f1a`, `#eb5a46`, `#c377e0`, `#0079bf`, `#00c2e0`, `#51e898`

### `Checklist`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `cardId` | `string` (UUID) | Yes | |
| `title` | `string` | Yes | |
| `createdAt` | `string` (ISO 8601) | Yes | |

### `ChecklistItem`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `checklistId` | `string` (UUID) | Yes | |
| `title` | `string` | Yes | |
| `isCompleted` | `boolean` | Yes | Default `false` |
| `position` | `number` (integer) | Yes | 1-based ordering within checklist |
| `dueDate` | `string` (ISO 8601) | No | Omitted when `null` |
| `assignedTo` | `User` | No | Nested assignee |
| `createdAt` | `string` (ISO 8601) | Yes | |

### `Comment`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `cardId` | `string` (UUID) | Yes | |
| `content` | `string` | Yes | |
| `user` | `User` | Yes | Author |
| `createdAt` | `string` (ISO 8601) | Yes | |
| `updatedAt` | `string` (ISO 8601) | Yes | |

### `Attachment`

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | |
| `cardId` | `string` (UUID) | Yes | |
| `kind` | `"FILE" \| "LINK"` | Yes | |
| `url` | `string` | Yes | Public URL or link |
| `filename` | `string` | No | |
| `mimeType` | `string` | No | |
| `sizeBytes` | `number` | No | |
| `createdAt` | `string` (ISO 8601) | Yes | |

### `CardLabel` (assign label response)

| Field | Type | Required in response | Notes |
|---|---|---|---|
| `cardId` | `string` (UUID) | Yes | |
| `labelId` | `string` (UUID) | Yes | |

---

## Health Check

### `GET /health`

Unauthenticated liveness probe.

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Backend running"
}
```

> This endpoint does **not** use the standard `{ success, data }` envelope.

---

## Auth Endpoints

### `POST /api/v1/auth/login`

Authenticate and set auth cookies.

**Auth:** None

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | `string` | **Yes** | Valid email format |
| `password` | `string` | **Yes** | Min length 1 |

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Success `200 OK`**

Sets `accessToken` and `refreshToken` cookies. Also ensures the user has a personal workspace (auto-created on first login if none exists).

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Doe",
      "email": "user@example.com",
      "avatarUrl": "https://example.com/avatar.png"
    }
  }
}
```

| Response field | Required | Notes |
|---|---|---|
| `data.user.id` | Yes | |
| `data.user.name` | Yes | |
| `data.user.email` | Yes | |
| `data.user.avatarUrl` | No | Omitted when null |

**Errors**

| Status | Message |
|---|---|
| 400 | Zod validation errors |
| 401 | `Invalid email or password` |

---

### `POST /api/v1/auth/refresh`

Issue a new access token using the refresh cookie.

**Auth:** None (requires `refreshToken` cookie)

**Request body:** None

**Success `200 OK`**

Refreshes `accessToken` cookie (and re-sets `refreshToken`).

```json
{
  "success": true,
  "data": {
    "refreshed": true
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 401 | `Refresh token required` |
| 401 | `Invalid or expired refresh token` |
| 401 | `Invalid refresh token` |
| 401 | `Refresh token expired` |
| 401 | `User not found` |

---

### `POST /api/v1/auth/logout`

Invalidate refresh token and clear auth cookies.

**Auth:** None

**Request body:** None

**Success `200 OK`**

Clears `accessToken` and `refreshToken` cookies.

```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

**Errors:** None expected (invalid refresh tokens are silently ignored).

---

## Workspace Endpoints

All workspace endpoints require authentication.

### Access control

| Action | Required role |
|---|---|
| View workspace | Any workspace member |
| Rename workspace | `OWNER` or `ADMIN` |
| Delete workspace | `OWNER` only |
| Add/remove members | `OWNER` or `ADMIN` |

### `POST /api/v1/workspaces`

Create a workspace. Creator becomes `OWNER`.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | `string` | **Yes** | 1–255 characters |
| `slug` | `string` | **Yes** | Lowercase alphanumeric + hyphens |

```json
{
  "name": "Acme Corp",
  "slug": "acme-corp"
}
```

**Success `201 Created`** — returns `Workspace`.

---

### `GET /api/v1/workspaces`

List workspaces the authenticated user belongs to.

**Success `200 OK`** — array of `Workspace` objects.

---

### `GET /api/v1/workspaces/:workspaceId`

Get workspace details including members and visible boards.

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Personal",
    "slug": "personal",
    "members": [ { "userId": "...", "role": "OWNER", "user": { } } ],
    "boards": [ { "id": "...", "title": "...", "workspaceId": "..." } ]
  }
}
```

---

### `PATCH /api/v1/workspaces/:workspaceId`

Rename a workspace.

**Request body:** `{ "name": "New Name" }`

---

### `DELETE /api/v1/workspaces/:workspaceId`

Delete a workspace and cascade all boards. **OWNER only.**

---

### `POST /api/v1/workspaces/:workspaceId/members`

Add a user to the workspace.

**Request body**

| Field | Type | Required |
|---|---|---|
| `userId` | `string` (UUID) | **Yes** |
| `role` | `"ADMIN" \| "MEMBER"` | No (default `MEMBER`) |

---

### `DELETE /api/v1/workspaces/:workspaceId/members/:userId`

Remove a user from the workspace. Cannot remove the last `OWNER`.

---

## Board Endpoints

All board endpoints require authentication. Access is determined by board ownership, board membership role, workspace membership (for `WORKSPACE` visibility), or public visibility.

### `POST /api/v1/boards`

Create a new board.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | `string` | **Yes** | 1–255 characters |
| `workspaceId` | `string` | **Yes** | Valid UUID — user must be a workspace member |
| `visibility` | `"PRIVATE" \| "WORKSPACE" \| "PUBLIC"` | No | Default `WORKSPACE` |
| `backgroundColor` | `string \| null` | No | Hex color |
| `backgroundImageUrl` | `string \| null` | No | Valid URL |

```json
{
  "title": "Product Roadmap",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Product Roadmap",
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-06-12T10:00:00.000Z",
    "updatedAt": "2026-06-12T10:00:00.000Z"
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |

---

### `GET /api/v1/boards`

List all boards the authenticated user can access (owned, member of, or visible via workspace/public visibility). Closed boards are excluded.

Each board includes `isStarred` when applicable.

**Request body:** None

**Success `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Product Roadmap",
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2026-06-12T10:00:00.000Z",
      "updatedAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

Ordered by `createdAt` descending (newest first). Returns empty array `[]` when user has no boards.

**Errors**

| Status | Message |
|---|---|
| 401 | `Authentication required` |

---

### `GET /api/v1/boards/:boardId`

Get full board details including lists, cards, labels, members, and checklists.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `boardId` | `string` | **Yes** | Valid UUID |

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "board": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Product Roadmap",
      "createdAt": "2026-06-12T10:00:00.000Z",
      "updatedAt": "2026-06-12T10:00:00.000Z"
    },
    "lists": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "boardId": "550e8400-e29b-41d4-a716-446655440001",
        "title": "To Do",
        "position": 1,
        "createdAt": "2026-06-12T10:05:00.000Z",
        "updatedAt": "2026-06-12T10:05:00.000Z",
        "cards": [
          {
            "id": "770e8400-e29b-41d4-a716-446655440003",
            "listId": "660e8400-e29b-41d4-a716-446655440002",
            "title": "Design login page",
            "description": "Include OAuth options",
            "dueDate": "2026-06-20T00:00:00.000Z",
            "position": 1,
            "status": "ACTIVE",
            "createdAt": "2026-06-12T10:10:00.000Z",
            "updatedAt": "2026-06-12T10:10:00.000Z",
            "labels": [
              {
                "id": "880e8400-e29b-41d4-a716-446655440004",
                "boardId": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Design",
                "color": "#c377e0"
              }
            ],
            "members": [
              {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Jane Doe",
                "email": "user@example.com"
              }
            ],
            "checklists": [
              {
                "id": "990e8400-e29b-41d4-a716-446655440005",
                "cardId": "770e8400-e29b-41d4-a716-446655440003",
                "title": "Tasks",
                "createdAt": "2026-06-12T10:15:00.000Z",
                "items": [
                  {
                    "id": "aa0e8400-e29b-41d4-a716-446655440006",
                    "checklistId": "990e8400-e29b-41d4-a716-446655440005",
                    "title": "Wireframes",
                    "isCompleted": false,
                    "position": 1,
                    "createdAt": "2026-06-12T10:16:00.000Z"
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "labels": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440004",
        "boardId": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Design",
        "color": "#c377e0"
      }
    ]
  }
}
```

**Behavior notes**

- Lists are ordered by `position` ascending.
- Only **ACTIVE** lists and cards are included (archived lists/cards excluded).
- Board details include `members` (board-level), card `comments`, `attachments`, and `coverAttachment`.
- Cards within each list are ordered by `position` ascending.
- Checklist items are ordered by `position` ascending.

**Errors**

| Status | Message |
|---|---|
| 400 | Invalid `boardId` UUID |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Board not found` |

---

### `PATCH /api/v1/boards/:boardId`

Update board settings. Requires board `ADMIN` role (or owner).

**Request body** — at least one field required

| Field | Type | Required |
|---|---|---|
| `title` | `string` | No |
| `visibility` | `"PRIVATE" \| "WORKSPACE" \| "PUBLIC"` | No |
| `backgroundColor` | `string \| null` | No |
| `backgroundImageUrl` | `string \| null` | No |

---

### `DELETE /api/v1/boards/:boardId`

Permanently delete a board. **Owner only.**

---

### `PATCH /api/v1/boards/:boardId/close`

Close (archive) a board. Sets `isClosed: true`. Requires `ADMIN`.

---

### `PATCH /api/v1/boards/:boardId/reopen`

Reopen a closed board. Requires `ADMIN`.

---

## Board Member Endpoints

Mounted under `/api/v1/boards/:boardId/members`.

### `GET /api/v1/boards/:boardId/members`

List board members with roles. Requires `OBSERVER` access.

**Success `200 OK`** — array of `BoardMember` objects.

---

### `POST /api/v1/boards/:boardId/members`

Add a workspace member to the board. Requires `ADMIN`.

**Request body:** `{ "userId": "...", "role": "MEMBER" }`

Roles: `ADMIN`, `MEMBER`, `OBSERVER`.

---

### `PATCH /api/v1/boards/:boardId/members/:userId`

Change a board member's role. Requires `ADMIN`. Cannot change owner role.

**Request body:** `{ "role": "OBSERVER" }`

---

### `DELETE /api/v1/boards/:boardId/members/:userId`

Remove a board member. Requires `ADMIN`. Cannot remove owner.

---

## Board Star Endpoints

### `GET /api/v1/boards/starred`

List the authenticated user's starred boards.

---

### `POST /api/v1/boards/:boardId/star`

Star a board (idempotent). Requires `OBSERVER` access.

---

### `DELETE /api/v1/boards/:boardId/star`

Unstar a board.

---

## List Endpoints

### `POST /api/v1/lists`

Create a list on a board.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `boardId` | `string` | **Yes** | Valid UUID |
| `title` | `string` | **Yes** | 1–255 characters |

```json
{
  "boardId": "550e8400-e29b-41d4-a716-446655440001",
  "title": "In Progress"
}
```

**Success `201 Created`**

Returns the created `List` object. `position` is auto-assigned (max + 1).

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Board not found` |

---

### `PATCH /api/v1/lists/:listId`

Update a list title.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `listId` | `string` | **Yes** | Valid UUID |

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | `string` | No* | 1–255 characters |

\* At least one field must be provided. Currently only `title` is updatable.

```json
{
  "title": "Doing"
}
```

**Success `200 OK`**

Returns the updated `List` object.

**Errors**

| Status | Message |
|---|---|
| 400 | `No fields to update` |
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `List not found` |

---

### `DELETE /api/v1/lists/:listId`

Delete a list and all its cards (cascade).

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `listId` | `string` | **Yes** | Valid UUID |

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Invalid `listId` UUID |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `List not found` |

---

### `PATCH /api/v1/lists/reorder`

Reorder lists within a board.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `boardId` | `string` | **Yes** | Valid UUID |
| `lists` | `array` | **Yes** | Min 1 item |
| `lists[].id` | `string` | **Yes** | Valid UUID |
| `lists[].position` | `number` | **Yes** | Integer ≥ 0 |

```json
{
  "boardId": "550e8400-e29b-41d4-a716-446655440001",
  "lists": [
    { "id": "660e8400-e29b-41d4-a716-446655440002", "position": 0 },
    { "id": "770e8400-e29b-41d4-a716-446655440003", "position": 1 }
  ]
}
```

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "reordered": true
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Board not found` |

---

### `PATCH /api/v1/lists/:listId/archive`

Archive a list (sets `status: "ARCHIVED"`, records `archivedAt`). List is hidden from board details; cards remain.

---

### `PATCH /api/v1/lists/:listId/restore`

Restore an archived list to `ACTIVE`.

---

## Card Endpoints

### `POST /api/v1/cards`

Create a card in a list.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `listId` | `string` | **Yes** | Valid UUID |
| `title` | `string` | **Yes** | 1–255 characters |

```json
{
  "listId": "660e8400-e29b-41d4-a716-446655440002",
  "title": "New task"
}
```

**Success `201 Created`**

Returns a `Card` object. `position` is auto-assigned. `status` defaults to `"ACTIVE"`.

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `List not found` |

---

### `PATCH /api/v1/cards/:cardId`

Update card fields.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |

**Request body** — at least one field required

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | `string` | No | 1–255 characters |
| `description` | `string` | No | Max 5000 characters |
| `startDate` | `string \| null` | No | ISO 8601 datetime; pass `null` to clear |
| `dueDate` | `string \| null` | No | ISO 8601 datetime; pass `null` to clear |
| `dueComplete` | `boolean` | No | Mark due date complete |
| `coverColor` | `string \| null` | No | Hex color |
| `coverAttachmentId` | `string \| null` | No | UUID of attachment on this card |

```json
{
  "title": "Updated title",
  "description": "Some details",
  "dueDate": "2026-06-30T18:00:00.000Z"
}
```

Clear due date:

```json
{
  "dueDate": null
}
```

**Success `200 OK`**

Returns the updated `Card` object.

**Errors**

| Status | Message |
|---|---|
| 400 | `No fields to update` |
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |

---

### `DELETE /api/v1/cards/:cardId`

Permanently delete a card.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Invalid `cardId` UUID |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |

---

### `PATCH /api/v1/cards/:cardId/archive`

Archive a card (sets `status` to `"ARCHIVED"`). Archived cards are hidden from board details.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |

**Request body:** None

**Success `200 OK`**

Returns the archived `Card` object with `"status": "ARCHIVED"`.

**Errors**

| Status | Message |
|---|---|
| 400 | Invalid `cardId` UUID |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |

---

### `PATCH /api/v1/cards/move`

Move a card within or between lists on the **same board**.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |
| `sourceListId` | `string` | **Yes** | Valid UUID — list the card is currently in |
| `destinationListId` | `string` | **Yes** | Valid UUID |
| `newPosition` | `number` | **Yes** | Integer ≥ 0 — **0-based** index in destination list |

```json
{
  "cardId": "770e8400-e29b-41d4-a716-446655440003",
  "sourceListId": "660e8400-e29b-41d4-a716-446655440002",
  "destinationListId": "880e8400-e29b-41d4-a716-446655440004",
  "newPosition": 0
}
```

**Success `200 OK`**

Returns the moved `Card` object with updated `listId` and `position`.

**Errors**

| Status | Message |
|---|---|
| 400 | `Card is not in the source list` |
| 400 | `Lists must belong to the same board` |
| 400 | `Failed to move card` |
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |
| 404 | `List not found` |

---

### `GET /api/v1/cards/search`

Search active cards by title (case-insensitive).

**Query params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `query` | `string` | **Yes** | Min 1 character |
| `boardId` | `string` | No | Valid UUID — scope search to one board |

```
GET /api/v1/cards/search?query=login&boardId=550e8400-e29b-41d4-a716-446655440001
```

**Success `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "listId": "660e8400-e29b-41d4-a716-446655440002",
      "title": "Design login page",
      "position": 1,
      "status": "ACTIVE",
      "createdAt": "2026-06-12T10:10:00.000Z",
      "updatedAt": "2026-06-12T10:10:00.000Z",
      "list": {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "boardId": "550e8400-e29b-41d4-a716-446655440001",
        "title": "To Do"
      }
    }
  ]
}
```

Only **ACTIVE** cards are returned. Ordered by `updatedAt` descending.

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors (e.g. missing `query`) |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` (when `boardId` provided) |

---

### `GET /api/v1/cards/filter`

Filter active cards by label, member, due date, and/or board.

**Query params** — all optional; combine as needed

| Param | Type | Required | Constraints |
|---|---|---|---|
| `labelId` | `string` | No | Valid UUID |
| `memberId` | `string` | No | Valid UUID (user ID) |
| `dueDate` | `string` | No | ISO 8601 datetime — exact match |
| `boardId` | `string` | No | Valid UUID |

```
GET /api/v1/cards/filter?boardId=550e8400-e29b-41d4-a716-446655440001&labelId=880e8400-e29b-41d4-a716-446655440004
```

**Success `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "listId": "660e8400-e29b-41d4-a716-446655440002",
      "title": "Design login page",
      "dueDate": "2026-06-20T00:00:00.000Z",
      "position": 1,
      "status": "ACTIVE",
      "createdAt": "2026-06-12T10:10:00.000Z",
      "updatedAt": "2026-06-12T10:10:00.000Z",
      "list": {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "boardId": "550e8400-e29b-41d4-a716-446655440001",
        "title": "To Do"
      },
      "labels": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440004",
          "boardId": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Design",
          "color": "#c377e0"
        }
      ],
      "members": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Jane Doe",
          "email": "user@example.com"
        }
      ]
    }
  ]
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` (when `boardId` provided) |

---

## Comment Endpoints

### `POST /api/v1/cards/:cardId/comments`

Add a comment to a card.

**Request body:** `{ "content": "Looks good!" }`

**Success `201 Created`** — returns `Comment` with nested `user`.

---

### `PATCH /api/v1/comments/:commentId`

Edit a comment. **Author only.**

**Request body:** `{ "content": "Updated text" }`

---

### `DELETE /api/v1/comments/:commentId`

Delete a comment. Author or board `ADMIN`.

---

## Attachment Endpoints

File uploads use **Supabase Storage**. The backend signs upload URLs and stores only the URL/path in the database.

### Upload flow

1. `POST /api/v1/attachments/sign-upload` — get `{ signedUrl, storagePath, expiresAt }`
2. Client uploads file bytes directly to `signedUrl` (PUT)
3. `POST /api/v1/cards/:cardId/attachments` — persist attachment row with public URL

For link attachments, skip step 1–2 and POST directly with `kind: "LINK"`.

### `POST /api/v1/attachments/sign-upload`

Get a Supabase signed upload URL.

**Request body**

| Field | Type | Required |
|---|---|---|
| `cardId` | `string` (UUID) | **Yes** |
| `filename` | `string` | **Yes** |
| `mimeType` | `string` | No |
| `sizeBytes` | `number` | No |

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "signedUrl": "https://...",
    "storagePath": "card-id/uuid-filename.png",
    "expiresAt": "2026-06-12T11:00:00.000Z"
  }
}
```

---

### `POST /api/v1/cards/:cardId/attachments`

Create an attachment record.

**Request body**

| Field | Type | Required |
|---|---|---|
| `url` | `string` | **Yes** |
| `kind` | `"FILE" \| "LINK"` | **Yes** |
| `storagePath` | `string` | No — required for FILE uploads via Supabase |
| `filename` | `string` | No |
| `mimeType` | `string` | No |
| `sizeBytes` | `number` | No |

---

### `DELETE /api/v1/attachments/:attachmentId`

Delete attachment. Removes Supabase object (if `storagePath` set) and clears any card cover reference.

---

## Label Endpoints

### `POST /api/v1/labels`

Create a label on a board.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `boardId` | `string` | **Yes** | Valid UUID |
| `name` | `string` | **Yes** | 1–100 characters |
| `color` | `string` | **Yes** | 1–20 characters (typically hex color) |

```json
{
  "boardId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Bug",
  "color": "#eb5a46"
}
```

**Success `201 Created`**

Returns the created `Label` object.

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Board not found` |

---

### `POST /api/v1/cards/:cardId/labels`

Assign an existing board label to a card.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `labelId` | `string` | **Yes** | Valid UUID |

```json
{
  "labelId": "880e8400-e29b-41d4-a716-446655440004"
}
```

**Success `201 Created`**

```json
{
  "success": true,
  "data": {
    "cardId": "770e8400-e29b-41d4-a716-446655440003",
    "labelId": "880e8400-e29b-41d4-a716-446655440004"
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |
| 404 | `Label not found on this board` |
| 409 | `Resource already exists` (label already assigned) |

---

### `DELETE /api/v1/cards/:cardId/labels/:labelId`

Remove a label from a card.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |
| `labelId` | `string` | **Yes** | Valid UUID |

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "removed": true
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Invalid UUID params |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |
| 404 | `Resource not found` (assignment does not exist) |

---

## Member Endpoints

### `GET /api/v1/members`

List users in a workspace who can be assigned to cards.

**Query params**

| Param | Type | Required |
|---|---|---|
| `workspaceId` | `string` (UUID) | **Yes** |

```
GET /api/v1/members?workspaceId=550e8400-e29b-41d4-a716-446655440000
```

Returns workspace members only. Caller must be a member of the workspace.

**Success `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Doe",
      "email": "user@example.com",
      "avatarUrl": "https://example.com/avatar.png"
    }
  ]
}
```

Ordered by `name` ascending.

**Errors**

| Status | Message |
|---|---|
| 401 | `Authentication required` |

---

### `POST /api/v1/cards/:cardId/members`

Assign a user to a card.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `memberId` | `string` | **Yes** | Valid UUID (user ID) |

```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success `201 Created`**

Returns the assigned `User` object (member).

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |
| 404 | `Member not found` |
| 409 | `Resource already exists` (member already assigned) |

---

### `DELETE /api/v1/cards/:cardId/members/:memberId`

Remove a user from a card.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |
| `memberId` | `string` | **Yes** | Valid UUID (user ID) |

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "removed": true
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Invalid UUID params |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |
| 404 | `Resource not found` (assignment does not exist) |

---

## Checklist Endpoints

### `POST /api/v1/cards/:cardId/checklists`

Create a checklist on a card.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `cardId` | `string` | **Yes** | Valid UUID |

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | `string` | **Yes** | 1–255 characters |

```json
{
  "title": "Acceptance criteria"
}
```

**Success `201 Created`**

Returns the created `Checklist` object (without items).

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Card not found` |

---

## Checklist Item Endpoints

### `POST /api/v1/checklist-items`

Create an item in a checklist.

**Request body**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `checklistId` | `string` | **Yes** | Valid UUID |
| `title` | `string` | **Yes** | 1–255 characters |

```json
{
  "checklistId": "990e8400-e29b-41d4-a716-446655440005",
  "title": "Write unit tests"
}
```

**Success `201 Created`**

Returns the created `ChecklistItem` object. `position` is auto-assigned. `isCompleted` defaults to `false`.

**Errors**

| Status | Message |
|---|---|
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Checklist not found` |

---

### `PATCH /api/v1/checklist-items/:itemId`

Update a checklist item.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `itemId` | `string` | **Yes** | Valid UUID |

**Request body** — at least one field required

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | `string` | No | 1–255 characters |
| `isCompleted` | `boolean` | No | `true` or `false` |
| `assignedToId` | `string \| null` | No | UUID — must be a board member |
| `dueDate` | `string \| null` | No | ISO 8601 datetime |

```json
{
  "isCompleted": true
}
```

**Success `200 OK`**

Returns the updated `ChecklistItem` object.

**Errors**

| Status | Message |
|---|---|
| 400 | `No fields to update` |
| 400 | Validation errors |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Checklist item not found` |

---

### `DELETE /api/v1/checklist-items/:itemId`

Delete a checklist item.

**URL params**

| Param | Type | Required | Constraints |
|---|---|---|---|
| `itemId` | `string` | **Yes** | Valid UUID |

**Success `200 OK`**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | Invalid `itemId` UUID |
| 401 | `Authentication required` |
| 403 | `You do not have access to this board` |
| 404 | `Checklist item not found` |

---

## Frontend Integration Notes

### Recommended request wrapper

```ts
type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; message: string };

async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`http://localhost:5000/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!body.success) {
    throw new Error(body.message);
  }

  return body.data;
}
```

### Suggested data-loading flow

```
Login → GET /workspaces (pick workspace)
      → GET /boards (dashboard)
      → GET /boards/:boardId (board view — single request for full state)
      → Mutations update local state or re-fetch board details
```

### Supabase file upload (attachments)

```ts
// 1. Get signed URL
const { signedUrl, storagePath } = await api("/attachments/sign-upload", {
  method: "POST",
  body: JSON.stringify({ cardId, filename: file.name, mimeType: file.type, sizeBytes: file.size }),
});

// 2. Upload directly to Supabase
await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

// 3. Persist attachment row (use public URL from your bucket)
await api(`/cards/${cardId}/attachments`, {
  method: "POST",
  body: JSON.stringify({
    kind: "FILE",
    url: publicUrl,
    storagePath,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  }),
});
```

### Access control summary

| Resource | Read | Write |
|---|---|---|
| Board (owner) | Full | Full |
| Board (ADMIN member) | Full | Full |
| Board (MEMBER) | Full | Mutations allowed |
| Board (OBSERVER member) | Full | Read-only |
| Board (WORKSPACE visibility + workspace member) | Read | Read-only |
| Board (PUBLIC) | Read (any authenticated user) | Read-only |

### Quick endpoint index

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/login` | Login (auto-creates personal workspace) |
| `POST` | `/api/v1/auth/refresh` | Refresh tokens |
| `POST` | `/api/v1/auth/logout` | Logout |
| `POST` | `/api/v1/workspaces` | Create workspace |
| `GET` | `/api/v1/workspaces` | List workspaces |
| `GET` | `/api/v1/workspaces/:workspaceId` | Workspace details |
| `PATCH` | `/api/v1/workspaces/:workspaceId` | Rename workspace |
| `DELETE` | `/api/v1/workspaces/:workspaceId` | Delete workspace |
| `POST` | `/api/v1/workspaces/:workspaceId/members` | Add workspace member |
| `DELETE` | `/api/v1/workspaces/:workspaceId/members/:userId` | Remove workspace member |
| `POST` | `/api/v1/boards` | Create board |
| `GET` | `/api/v1/boards` | List accessible boards |
| `GET` | `/api/v1/boards/starred` | List starred boards |
| `GET` | `/api/v1/boards/:boardId` | Board details |
| `PATCH` | `/api/v1/boards/:boardId` | Update board |
| `DELETE` | `/api/v1/boards/:boardId` | Delete board |
| `PATCH` | `/api/v1/boards/:boardId/close` | Close board |
| `PATCH` | `/api/v1/boards/:boardId/reopen` | Reopen board |
| `POST` | `/api/v1/boards/:boardId/star` | Star board |
| `DELETE` | `/api/v1/boards/:boardId/star` | Unstar board |
| `GET` | `/api/v1/boards/:boardId/members` | List board members |
| `POST` | `/api/v1/boards/:boardId/members` | Add board member |
| `PATCH` | `/api/v1/boards/:boardId/members/:userId` | Update board member role |
| `DELETE` | `/api/v1/boards/:boardId/members/:userId` | Remove board member |
| `POST` | `/api/v1/lists` | Create list |
| `PATCH` | `/api/v1/lists/reorder` | Reorder lists |
| `PATCH` | `/api/v1/lists/:listId` | Update list |
| `DELETE` | `/api/v1/lists/:listId` | Delete list |
| `PATCH` | `/api/v1/lists/:listId/archive` | Archive list |
| `PATCH` | `/api/v1/lists/:listId/restore` | Restore list |
| `GET` | `/api/v1/cards/search` | Search cards |
| `GET` | `/api/v1/cards/filter` | Filter cards |
| `POST` | `/api/v1/cards` | Create card |
| `PATCH` | `/api/v1/cards/move` | Move card |
| `PATCH` | `/api/v1/cards/:cardId` | Update card |
| `PATCH` | `/api/v1/cards/:cardId/archive` | Archive card |
| `DELETE` | `/api/v1/cards/:cardId` | Delete card |
| `POST` | `/api/v1/cards/:cardId/comments` | Create comment |
| `PATCH` | `/api/v1/comments/:commentId` | Update comment |
| `DELETE` | `/api/v1/comments/:commentId` | Delete comment |
| `POST` | `/api/v1/attachments/sign-upload` | Get Supabase signed upload URL |
| `POST` | `/api/v1/cards/:cardId/attachments` | Create attachment |
| `DELETE` | `/api/v1/attachments/:attachmentId` | Delete attachment |
| `POST` | `/api/v1/labels` | Create label |
| `POST` | `/api/v1/cards/:cardId/labels` | Assign label |
| `DELETE` | `/api/v1/cards/:cardId/labels/:labelId` | Remove label |
| `GET` | `/api/v1/members?workspaceId=` | List workspace members |
| `POST` | `/api/v1/cards/:cardId/members` | Assign member |
| `DELETE` | `/api/v1/cards/:cardId/members/:memberId` | Remove member |
| `POST` | `/api/v1/cards/:cardId/checklists` | Create checklist |
| `POST` | `/api/v1/checklist-items` | Create checklist item |
| `PATCH` | `/api/v1/checklist-items/:itemId` | Update checklist item |
| `DELETE` | `/api/v1/checklist-items/:itemId` | Delete checklist item |
