# Trello Clone Frontend Implementation Guide

## Objective

Build a Trello-style Kanban frontend application.

The frontend should closely resemble Trello's UI and UX patterns while maintaining clean architecture and modern React best practices.

---

# Tech Stack

## Core

- React 19+
- TypeScript
- Vite

## Routing

- TanStack Router

## Server State

- TanStack Query

## Client State

- Zustand

## Styling

- TailwindCSS

## Drag & Drop

- dnd-kit

## API Client

- Axios

## Forms

- React Hook Form
- Zod

---

## State Ownership

### TanStack Query

Use for:

- Boards
- Lists
- Cards
- Labels
- Members
- Checklists
- Authentication User

Anything fetched from the backend.

---

### Zustand

Use for UI State only.

Examples:

```ts
selectedCard;

isCardModalOpen;

searchTerm;

activeFilters;

draggingCardId;

draggingListId;
```

Never duplicate server data in Zustand.

---

# Authentication

Use cookie-based authentication.

Backend will set:

```txt
access_token

refresh_token
```

inside HTTP-only cookies.

Frontend should NOT store tokens.

Never use:

```txt
localStorage

sessionStorage
```

for tokens.

---

# Axios Configuration

Create:

```txt
src/lib/api.ts
```

Requirements:

```ts
baseURL;

withCredentials: true;
```

Example:

```ts
axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
```

---

# Authentication Flow

## Login

```txt
POST /auth/login
```

Success:

```txt
Cookies automatically set
```

Then:

```txt
GET /auth/me
```

Store user in TanStack Query.

---

## Protected Routes

Create:

```txt
AuthGuard
```

Responsibilities:

- Fetch current user
- Redirect to login if unauthenticated

---

# Optimistic Updates

Required for:

```txt
Move Card

Move List

Update Card

Delete Card
```

Use:

```ts
queryClient.setQueryData();
```

before mutation completes.

This creates Trello-like responsiveness.

---

# State Management

Create Zustand store:

```txt
board-store.ts
```

Example:

```ts
interface BoardStore {
  selectedCardId: string | null;

  isCardModalOpen: boolean;

  searchTerm: string;

  setSelectedCardId: () => void;
}
```

---

# Drag & Drop Architecture

Use:

```txt
@dnd-kit/core

@dnd-kit/sortable

@dnd-kit/utilities
```

---

# Drag Targets

## Lists

```txt
Todo

In Progress

Review

Done
```

Lists must be sortable.

---

## Cards

Cards must support:

```txt
Same list reorder

Cross list movement
```

---

# Drag Flow

On Drag End:

```txt
Update UI Optimistically

Call API

Persist Positions

Rollback on Failure
```

---

# Core Components

## Board

Responsibilities:

- Render lists
- Handle list sorting

---

## List

Responsibilities:

- Render cards
- Handle card sorting

---

## Card

Responsibilities:

- Render card preview

Display:

- title
- labels
- due date
- member avatars
- checklist progress

---

## Card Modal

Responsibilities:

- Edit card
- Description
- Labels
- Members
- Due Date
- Checklist

---

# Forms

Use:

```txt
React Hook Form

Zod
```

Example:

```ts
CreateCardSchema;

CreateListSchema;

LoginSchema;
```

---

# Error Handling

Create:

```txt
ErrorBoundary
```

Create:

```txt
ApiErrorHandler
```

Requirements:

- Handle 401
- Handle 403
- Handle 500

Show user-friendly messages.

---

# Search

Support:

```txt
Search By Card Title
```

Implement:

```txt
Debounce

300ms
```

---

# Filters

Support:

```txt
Label

Member

Due Date
```

Store active filters inside Zustand.

---

# UI Requirements

Closely resemble Trello.

Key characteristics:

- Horizontal lists
- White cards
- Blue board background
- Rounded corners
- Minimal shadows
- Compact spacing

---

# Responsive Requirements

Desktop first.

Support:

```txt
Desktop

Tablet

Mobile
```

Lists should scroll horizontally.

---

# Accessibility

Requirements:

- Button labels
- Keyboard navigation
- Focus states
- Proper aria attributes

---

# Performance

Use:

```txt
React.memo

useMemo

useCallback
```

only when necessary.

Avoid premature optimization.

---

# Type Definitions



No usage of:

```ts
any;
```

---

# Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

# Non Functional Requirements

- TypeScript Strict Mode
- Feature Based Architecture
- Reusable Components
- TanStack Query Best Practices
- Optimistic Updates
- Cookie Authentication
- Clean UI
- Trello-like UX
- Responsive Design
- Modular Code
- No any Types
- Proper Error Handling

Generate the frontend implementation following all requirements above.