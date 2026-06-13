# Trello Clone Database Schema

## Tech Stack

- PostgreSQL (Supabase)
- Prisma ORM
- Express.js
- TypeScript
- JWT Authentication
- Access Token + Refresh Token

---

# Design Principles

- UUID primary keys
- Soft archive for cards
- Many-to-many relationships for labels and members
- Refresh token persistence
- Position-based ordering for drag-and-drop
- Cascade deletes where appropriate

---

# Enums

```prisma
enum CardStatus {
  ACTIVE
  ARCHIVED
}

enum ActivityType {
  BOARD_CREATED

  LIST_CREATED
  LIST_UPDATED
  LIST_DELETED

  CARD_CREATED
  CARD_UPDATED
  CARD_MOVED
  CARD_ARCHIVED
  CARD_DELETED

  MEMBER_ASSIGNED
  MEMBER_UNASSIGNED

  COMMENT_CREATED

  CHECKLIST_CREATED
  CHECKLIST_UPDATED
}
```

---

# User

Represents an authenticated application user.

```prisma
model User {
  id            String   @id @default(uuid())

  name          String

  email         String   @unique

  passwordHash  String

  avatarUrl     String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  boards        Board[]

  refreshTokens RefreshToken[]

  assignedCards CardMember[]

  comments      Comment[]

  activities    Activity[]

  @@map("users")
}
```

---

# Refresh Token

Stores active refresh tokens.

```prisma
model RefreshToken {
  id          String   @id @default(uuid())

  userId      String

  tokenHash   String

  expiresAt   DateTime

  createdAt   DateTime @default(now())

  user User
    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])

  @@map("refresh_tokens")
}
```

---

# Board

A Trello board.

```prisma
model Board {
  id          String   @id @default(uuid())

  title       String

  ownerId     String

  owner User
    @relation(fields: [ownerId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lists        List[]
  labels       Label[]
  activities   Activity[]

  @@index([ownerId])

  @@map("boards")
}
```

---

# List

Kanban column.

```prisma
model List {
  id          String   @id @default(uuid())

  boardId     String

  title       String

  position    Int

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  board Board
    @relation(fields: [boardId], references: [id], onDelete: Cascade)

  cards Card[]

  @@index([boardId])

  @@map("lists")
}
```

---

# Card

Represents a task.

```prisma
model Card {
  id            String   @id @default(uuid())

  listId        String

  title         String

  description   String?

  dueDate       DateTime?

  position      Int

  status        CardStatus @default(ACTIVE)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  list List
    @relation(fields: [listId], references: [id], onDelete: Cascade)

  labels      CardLabel[]
  members     CardMember[]

  checklists  Checklist[]

  comments    Comment[]

  activities  Activity[]

  @@index([listId])
  @@index([dueDate])

  @@map("cards")
}
```

---

# Label

Board-level label.

```prisma
model Label {
  id          String   @id @default(uuid())

  boardId     String

  name        String

  color       String

  board Board
    @relation(fields: [boardId], references: [id], onDelete: Cascade)

  cards CardLabel[]

  @@index([boardId])

  @@map("labels")
}
```

---

# CardLabel

Many-to-many mapping.

```prisma
model CardLabel {
  cardId      String
  labelId     String

  card Card
    @relation(fields: [cardId], references: [id], onDelete: Cascade)

  label Label
    @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([cardId, labelId])

  @@map("card_labels")
}
```

---

# CardMember

Card assignees.

```prisma
model CardMember {
  cardId      String
  userId      String

  assignedAt  DateTime @default(now())

  card Card
    @relation(fields: [cardId], references: [id], onDelete: Cascade)

  user User
    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([cardId, userId])

  @@map("card_members")
}
```

---

# Checklist

Checklist attached to a card.

```prisma
model Checklist {
  id          String @id @default(uuid())

  cardId      String

  title       String

  createdAt   DateTime @default(now())

  card Card
    @relation(fields: [cardId], references: [id], onDelete: Cascade)

  items ChecklistItem[]

  @@index([cardId])

  @@map("checklists")
}
```

---

# Checklist Item

Checklist tasks.

```prisma
model ChecklistItem {
  id            String @id @default(uuid())

  checklistId   String

  title         String

  isCompleted   Boolean @default(false)

  position      Int

  createdAt     DateTime @default(now())

  checklist Checklist
    @relation(fields: [checklistId], references: [id], onDelete: Cascade)

  @@index([checklistId])

  @@map("checklist_items")
}
```

---

# Comment

Card discussion.

```prisma
model Comment {
  id          String @id @default(uuid())

  cardId      String

  userId      String

  content     String

  createdAt   DateTime @default(now())

  card Card
    @relation(fields: [cardId], references: [id], onDelete: Cascade)

  user User
    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([cardId])

  @@map("comments")
}
```

---

# Activity Log

Audit trail.

```prisma
model Activity {
  id          String @id @default(uuid())

  boardId     String?

  cardId      String?

  userId      String?

  type        ActivityType

  message     String

  createdAt   DateTime @default(now())

  board Board?
    @relation(fields: [boardId], references: [id], onDelete: Cascade)

  card Card?
    @relation(fields: [cardId], references: [id], onDelete: Cascade)

  user User?
    @relation(fields: [userId], references: [id])

  @@index([boardId])
  @@index([cardId])

  @@map("activities")
}
```

---

# Drag & Drop Strategy

## List Ordering

```txt
Todo         -> 1
In Progress  -> 2
Review       -> 3
Done         -> 4
```

Store order using:

```prisma
position Int
```

---

## Card Ordering

```txt
Card A -> 1
Card B -> 2
Card C -> 3
```

Store order using:

```prisma
position Int
```

Reordering updates positions inside a Prisma transaction.

---

# Indexes

Recommended indexes:

```txt
users.email

refresh_tokens.userId

boards.ownerId

lists.boardId

cards.listId

cards.dueDate

labels.boardId

checklists.cardId

comments.cardId

activities.boardId
activities.cardId
```

---

# Seed Data

Users:

```txt
228r5a0407@gmail.com
john@example.com
alice@example.com
```

Board:

```txt
Personal Project
```

Lists:

```txt
Todo
In Progress
Review
Done
```

Labels:

```txt
Bug
Feature
Review
High Priority
```

Cards:

```txt
Setup Backend
Implement Login
Create Drag Drop
Deploy Application
```
